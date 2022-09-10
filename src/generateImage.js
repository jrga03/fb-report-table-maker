import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const fontSize = 18; // TODO:
const fontFamily = "sans-serif"; // TODO:
const borderThickness = 1;
const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const hours = [0, 3, 6, 9, 12, 15, 18, 21];

export function generateImage(data, formData) {
  const columns = 8;
  const rows = 25;
  const lineWidth = borderThickness;
  const lineColor = formData.borderColor;

  const cellWidth = (formData.width - lineWidth) / columns;
  const cellHeight = (formData.height - lineWidth) / rows;

  const canvas = document.createElement("canvas");
  canvas.width = formData.width;
  canvas.height = formData.height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const offset = lineWidth / 2;

  daysOfWeek.forEach((dayOfWeek, index) => {
    ctx.save();

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = formData.fontColor;
    ctx.fillText(
      dayOfWeek,
      cellWidth * (index + 1) + cellWidth / 2,
      formData.height - cellHeight / 2
    );

    ctx.restore();
  });

  hours.forEach((hour, index) => {
    const hourString = dayjs().hour(hour).minute(0).format("h:mm A");

    ctx.save();

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = formData.fontColor;
    ctx.fillText(hourString, cellWidth / 2, cellHeight * index * 3 + cellHeight / 2);

    ctx.restore();
  });

  data.forEach((row, rowIndex) => {
    row.forEach((color, columnIndex) => {
      if (color !== null) {
        ctx.save();

        ctx.fillStyle = color;
        ctx.fillRect(
          offset + (columnIndex + 1) * cellWidth,
          offset + rowIndex * cellHeight,
          cellWidth,
          cellHeight
        );

        ctx.restore();
      }
    });
  });

  for (let i = 0; i <= columns + 2; i++) {
    ctx.moveTo(offset + i * cellWidth, 0);
    ctx.lineTo(offset + i * cellWidth, formData.height - offset);
  }

  for (let i = 0; i <= rows + 2; i++) {
    ctx.moveTo(0, offset + i * cellHeight);
    ctx.lineTo(formData.width - offset, offset + i * cellHeight);
  }

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.stroke();

  return canvas.toDataURL("image/png", 1.0);
}
