# FileUpload Component

Универсал файл upload component, Ant Design Upload-ыг суурилсан.

## Ашиглалт

```tsx
import FileUpload from "@/components/ui/upload";

// Form.Item дотор ашиглах
<Form.Item
  label="Файл"
  name="file"
>
  <FileUpload
    placeholder="Файл оруулах"
    buttonText="Файл сонгох"
  />
</Form.Item>

// Олон файл ашиглах
<FileUpload
  multiple
  maxCount={5}
  accept=".pdf,.doc,.docx"
  placeholder="Баримт бичиг оруулах"
  buttonText="Баримт сонгох"
/>

// Зураг upload
<FileUpload
  listType="picture-card"
  accept="image/*"
  placeholder="Зураг оруулах"
  buttonText="Зураг сонгох"
/>
```

## Props

- `value` - Form.Item-ээс ирэх утга
- `onChange` - Form.Item-д буцаах функц
- `listType` - "text" | "picture" | "picture-card" | "picture-circle"
- `multiple` - Олон файл upload хийх эсэх
- `accept` - Зөвшөөрөгдөх файлын төрөл
- `maxCount` - Хамгийн их файлын тоо
- `disabled` - Идэвхгүй болгох
- `placeholder` - Placeholder текст
- `buttonText` - Товчны текст
- `showUploadList` - Upload жагсаалт харуулах эсэх

## API

API endpoint: `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL}/file-upload`

Алдааны мессежийг автоматаар "Файл хуулахад алдаа гарсан" болгон өөрчилдөг.
