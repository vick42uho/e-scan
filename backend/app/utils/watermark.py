import io
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

def apply_image_watermark(
    image_bytes: bytes,
    user_id: str = "Staff",
    custom_stamp: str = "สำเนาถูกต้อง COPY",
    include_datetime: bool = True
) -> bytes:
    """
    ประทับตราลายน้ำรักษาความปลอดภัยแบบ Dynamic Watermark
    ลงบนภาพสแกนเวชระเบียน เพื่อป้องกันการนำข้อมูลไปใช้นอกระบบ
    """
    try:
        base_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        width, height = base_image.size

        # สร้าง overlay layer แบบโปร่งใส
        overlay = Image.new("RGBA", (width, height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)

        now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        watermark_text = f"{custom_stamp} - {user_id}"
        if include_datetime:
            watermark_text += f" - {now_str}"

        # คำนวณขนาด Font ตามความกว้างของภาพ
        font_size = max(24, int(width / 35))
        try:
            # พยายามโหลด system font หรือ fallback font
            font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

        # วาดลายน้ำเฉียง (Repeated diagonal watermarks across canvas)
        # 1. วาดตราสี่เหลี่ยมด้านล่างขวา เหมือนตราประทับโรงพยาบาล
        stamp_box_w = int(font_size * 10)
        stamp_box_h = int(font_size * 3.5)
        stamp_x = width - stamp_box_w - 40
        stamp_y = height - stamp_box_h - 40

        # กรอบสี่เหลี่ยมตราประทับสีน้ำเงินเข้มโปร่งแสง
        draw.rectangle(
            [stamp_x, stamp_y, stamp_x + stamp_box_w, stamp_y + stamp_box_h],
            outline=(15, 76, 129, 180),
            width=3
        )
        draw.text(
            (stamp_x + 15, stamp_y + 10),
            custom_stamp,
            font=font,
            fill=(15, 76, 129, 180)
        )
        draw.text(
            (stamp_x + 15, stamp_y + 10 + font_size + 5),
            f"ผู้พิมพ์: {user_id} ({now_str[:10]})",
            font=font,
            fill=(15, 76, 129, 180)
        )

        # 2. ลายน้ำจางๆ ทแยงมุมกลางหน้าจอ (Security protection)
        diagonal_layer = Image.new("RGBA", (width, height), (255, 255, 255, 0))
        diag_draw = ImageDraw.Draw(diagonal_layer)
        center_x = width // 2
        center_y = height // 2
        diag_text = f"YANHEE HOSPITAL - {user_id} - {now_str}"
        diag_draw.text(
            (center_x - (len(diag_text) * font_size // 4), center_y),
            diag_text,
            font=font,
            fill=(180, 180, 180, 70)
        )
        rotated_diag = diagonal_layer.rotate(30, center=(center_x, center_y))

        # รวม layer
        watermarked = Image.alpha_composite(base_image, overlay)
        watermarked = Image.alpha_composite(watermarked, rotated_diag)

        # บันทึกเป็น JPEG/PNG
        output = io.BytesIO()
        watermarked.convert("RGB").save(output, format="JPEG", quality=90)
        return output.getvalue()
    except Exception as e:
        print(f"Watermark generation error: {e}")
        return image_bytes
