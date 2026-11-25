import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { Order, ORDER_STATUS, Product, Review } from '@/models';

export interface CreateReviewPayload {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
}

export interface ModerateReviewPayload {
  status?: 'published' | 'hidden';
  replyText?: string;
}

async function recalculateProductRating(productId: mongoose.Types.ObjectId | string) {
  const objectId =
    typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

  const [stats] = await Review.aggregate([
    { $match: { productId: objectId, status: 'published' } },
    {
      $group: {
        _id: '$productId',
        ratingAvg: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await Product.updateOne(
    { _id: objectId },
    {
      $set: {
        ratingAvg: stats ? Number(stats.ratingAvg.toFixed(2)) : 0,
        ratingCount: stats ? stats.ratingCount : 0,
      },
    }
  );
}

export async function createReview(userId: string, payload: CreateReviewPayload) {
  await connectDB();

  const { productId, orderId, rating, comment } = payload;

  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(orderId)
  ) {
    throw new AppError('Valid productId and orderId are required', 400);
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new AppError('Rating must be a number between 1 and 5', 400);
  }

  if (!comment?.trim()) {
    throw new AppError('Review comment is required', 400);
  }

  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) {
    throw new AppError('Order not found for this user', 404);
  }

  const deliveredStatus = ORDER_STATUS.DELIVERED ?? 'delivered';
  if (order.status !== deliveredStatus) {
    throw new AppError('You can only review products from delivered orders', 400);
  }

  const orderedProduct = (order.items as Array<{ productId: mongoose.Types.ObjectId }>).some(
    (item) => item.productId.toString() === productId
  );
  if (!orderedProduct) {
    throw new AppError('This product was not part of the specified order', 400);
  }

  const duplicate = await Review.exists({ userId, productId, orderId });
  if (duplicate) {
    throw new AppError('You have already reviewed this product for this order', 409);
  }

  const review = await Review.create({
    userId,
    productId,
    orderId,
    rating,
    comment: comment.trim(),
    status: 'published',
  });

  await recalculateProductRating(productId);

  return review;
}

export async function moderateReview(
  reviewId: string,
  payload: ModerateReviewPayload
) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new AppError('Invalid review ID', 400);
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  let statusChanged = false;

  if (payload.status !== undefined) {
    if (payload.status !== 'published' && payload.status !== 'hidden') {
      throw new AppError('Review status must be "published" or "hidden"', 400);
    }
    if (review.status !== payload.status) {
      review.status = payload.status;
      statusChanged = true;
    }
  }

  if (payload.replyText !== undefined) {
    const trimmed = payload.replyText.trim();
    if (!trimmed) {
      throw new AppError('Reply text cannot be empty', 400);
    }
    review.reply = {
      text: trimmed,
      at: new Date(),
    };
  }

  await review.save();

  if (statusChanged) {
    await recalculateProductRating(review.productId);
  }

  return review.toObject();
}