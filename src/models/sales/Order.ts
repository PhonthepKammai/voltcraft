import { Schema } from "mongoose";
import { opts, ref, registerModel } from "../_shared/helpers";

export const ORDER_STATUS = [
  "pending",    // รอชำระเงิน
  "paid",       // ชำระเงินผ่าน Stripe สำเร็จ (รอ Admin จัดส่ง)
  "shipped",    // Admin จัดส่งแล้ว (มีเลขพัสดุ)
  "delivered",  // ลูกค้าได้รับสินค้าแล้ว
  "cancelled",  // ยกเลิกออเดอร์
] as const;

const OrderItemSchema = new Schema(
  {
    productId: { ...ref("Product"), required: true },
    sku: String,                                   // snapshot รหัสสินค้า
    name: { type: String, required: true },        // snapshot ชื่อสินค้า
    image: String,                                 // snapshot รูปปก (ช่วยให้หน้าประวัติสั่งซื้อแสดงรูปได้ทันทีโดยไม่ต้อง populate)
    unitPrice: { type: Number, required: true },   // snapshot ราคาตอนสั่งซื้อ
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true }, // เช่น VC-2611-000123
    customerId: { ...ref("User"), required: true, index: true },
    
    items: { 
      type: [OrderItemSchema], 
      validate: (v: unknown[]) => v.length > 0 
    },

    // Snapshot ที่อยู่จัดส่ง
    shippingAddress: {
      recipient: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      subdistrict: String,
      district: String,
      province: String,
      postalCode: String,
    },

    // สรุปยอดเงิน
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // สถานะหลักของออเดอร์
    status: { 
      type: String, 
      enum: ORDER_STATUS, 
      default: "pending", 
      index: true 
    },

    // ข้อมูลการชำระเงิน (ยุบจาก Payment.ts เพื่อใช้กับ Stripe)
    payment: {
      method: { type: String, enum: ["stripe", "cod"], default: "stripe" },
      status: { 
        type: String, 
        enum: ["unpaid", "paid", "refunded"], 
        default: "unpaid" 
      },
      stripeSessionId: { type: String, index: true }, // ใช้เช็กตอน Stripe Webhook ยิงกลับมา
      paidAt: Date,
    },

    // ข้อมูลการจัดส่ง (ยุบจาก Shipment.ts ให้ Admin กรอกได้เลย)
    shipment: {
      carrier: String,     // เช่น Kerry, Flash, ไปรษณีย์ไทย
      trackingNo: String,  // เลขพัสดุ
      shippedAt: Date,
      deliveredAt: Date,
    },

    note: String, // หมายเหตุจากลูกค้าถึงร้านค้า
  },
  opts
);

OrderSchema.index({ createdAt: -1 });

export const Order = registerModel("Order", OrderSchema);