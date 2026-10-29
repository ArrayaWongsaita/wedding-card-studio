# Wedding Card Studio

เว็บออกแบบการ์ดแต่งงาน: เลือกแบบการ์ด → กรอกชื่อบ่าวสาว วันที่ เวลา สถานที่ → ดาวน์โหลดเป็น PNG/JPG (1200 × 1680 px, สัดส่วน 5×7 นิ้ว)

ใช้ HTML, CSS และ JavaScript ล้วน ไม่ต้อง build จึง deploy บน GitHub Pages ได้ทันที

## โครงสร้าง

```
index.html          หน้าเว็บ
css/style.css       สไตล์
js/templates.js     แบบการ์ดทั้งหมด (วาดด้วย Canvas)
js/app.js           ฟอร์ม พรีวิว อัปโหลดรูป และดาวน์โหลด
.nojekyll           ให้ GitHub Pages เสิร์ฟไฟล์ตามเดิม
```

## ทดสอบบนเครื่อง

```bash
python3 -m http.server 8000
# เปิด http://localhost:8000
```

## Deploy ด้วย GitHub Pages

```bash
git init
git add .
git commit -m "Wedding card studio"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

จากนั้นไปที่ **Settings → Pages** ของ repo แล้วตั้ง **Source: Deploy from a branch**, **Branch: main / (root)** แล้วกด Save
รอประมาณ 1 นาที เว็บจะอยู่ที่ `https://<username>.github.io/<repo>/`

## เพิ่มแบบการ์ดใหม่

เพิ่ม object ใหม่ใน array `TEMPLATES` ใน [js/templates.js](js/templates.js):

```js
{
  id: "my-card",
  name: "ชื่อที่แสดงในแกลเลอรี",
  text: "#333333",     // สีตัวอักษรหลัก
  accent: "#b08d57",   // สีเส้นตกแต่ง, "&" และข้อความท้ายการ์ด
  maxWidth: 820,       // ความกว้างสูงสุดของข้อความ
  draw(ctx) {
    // วาดพื้นหลังในพื้นที่ 1200 x 1680
  },
}
```

ถ้าอยากใช้รูปภาพที่ออกแบบไว้แล้ว (เช่น จาก Canva) เป็นพื้นหลัง ให้โหลดรูปแล้วใช้ `ctx.drawImage(img, 0, 0, CARD_W, CARD_H)` ใน `draw` (เก็บรูปไว้ใน repo เดียวกัน เพื่อไม่ให้ canvas ถูกบล็อกตอนดาวน์โหลด)
