import { useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { download, getPercentageBetweenMinMax, interpolateColor } from "./utils";

dayjs.extend(utc);
dayjs.extend(timezone);

const defaultMinColor = "#ffffff";
const defaultMaxColor = "#57bb8a";
const fontColor = "#003850";
const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const hours = [0, 3, 6, 9, 12, 15, 18, 21];

function generateImage(data, width, height) {
  const columns = 8;
  const rows = 25;
  const lineWidth = 1;
  const lineColor = "#cccccc";

  const cellWidth = (width - lineWidth) / columns;
  const cellHeight = (height - lineWidth) / rows;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const offset = lineWidth / 2;

  daysOfWeek.forEach((dayOfWeek, index) => {
    ctx.save();

    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = fontColor;
    ctx.fillText(dayOfWeek, cellWidth * (index + 1) + cellWidth / 2, height - cellHeight / 2);

    ctx.restore();
  });

  hours.forEach((hour, index) => {
    const hourString = dayjs().hour(hour).minute(0).format("h:mm A");

    ctx.save();

    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = fontColor;
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
    ctx.lineTo(offset + i * cellWidth, height - offset);
  }

  for (let i = 0; i <= rows + 2; i++) {
    ctx.moveTo(0, offset + i * cellHeight);
    ctx.lineTo(width - offset, offset + i * cellHeight);
  }

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.stroke();

  return canvas.toDataURL("image/png", 1.0);
}

function App() {
  const [colors, setColors] = useState({
    minColor: defaultMinColor,
    maxColor: defaultMaxColor
  });

  const [dimensions, setDimensions] = useState({
    width: 1000,
    height: 600
  });

  const [imgSrc, setImgSrc] = useState(null);

  // useEffect(() => {
  //   (async function () {
  //     const fonts = await listFonts();
  //     console.log(fonts);
  //   })();
  // });

  const onChangeColor = (e) => {
    const { name, value } = e.target;
    setColors((prevColors) => ({
      ...prevColors,
      [name]: value
    }));
  };

  const generateTable = (data) => {
    const dataUrl = generateImage(data, dimensions.width, dimensions.height);
    setImgSrc(dataUrl);
  };

  const generateTableData = (data) => {
    const tableData = Array.from({ length: 24 }, (_, index) =>
      data.reduce((acc, cur) => {
        if (cur.hour === index) {
          if (typeof acc[cur.dayOfWeek] === "undefined") {
            acc[cur.dayOfWeek] = cur.reach;
          } else {
            acc[cur.dayOfWeek] += cur.reach;
          }
        }

        return acc;
      }, Array(7).fill())
    );

    const tableDataUniques = Array.from(
      new Set(tableData.flat().filter((x) => typeof x !== "undefined"))
    );

    const minValue = Math.min(...tableDataUniques);
    const maxValue = Math.max(...tableDataUniques);
    const minColor = colors.minColor.slice(1);
    const maxColor = colors.maxColor.slice(1);

    const colorTableData = tableData.map((row) =>
      row.map((value) =>
        typeof value !== "undefined"
          ? `#${interpolateColor(
              minColor,
              maxColor,
              getPercentageBetweenMinMax(value, minValue, maxValue)
            )}`
          : null
      )
    );

    generateTable(colorTableData);
  };

  const onParseComplete = (res) => {
    let data = res.data;

    if (data?.[0]?.[0] === "sep=" && data?.[1]?.[0] === "Content") {
      data = data.slice(2);
    }

    const keys = data[0];

    const hasPostTime = keys.includes("Post time");
    const hasReach = keys.includes("Reach");

    if (!hasPostTime || !hasReach) {
      alert('Invalid CSV. \n\nData should have "Post time" and "Reach" as columns.');
      return;
    }

    const values = data.slice(1);
    const dataObj = values
      .map((value) => {
        const entries = keys.map((key, index) => [key, value[index]]);
        return Object.fromEntries(entries);
      })
      .map((value) => {
        const origPostTime = dayjs(value["Post time"]).tz("America/Los_Angeles", true).format();
        const phPostTime = dayjs(origPostTime).tz("Asia/Manila").local().format();
        const dayjsPhPostTime = dayjs(phPostTime);
        const hour = dayjsPhPostTime.hour();
        const dayOfWeek = dayjsPhPostTime.day();

        return {
          ...value,
          origPostTime,
          phPostTime,
          hour,
          dayOfWeek,
          reach: Number.parseInt(value.Reach, 10)
        };
      });

    generateTableData(dataObj);
  };

  const onChangeDimension = (e) => {
    const { name, value } = e.target;

    setDimensions((prevDimensions) => ({
      ...prevDimensions,
      [name]: Number.parseInt(value, 10)
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const formData = Object.fromEntries(form);

    Papa.parse(formData.csv, {
      skipEmptyLines: true,
      complete: onParseComplete
    });
  };

  const onClickDownload = (e) => {
    e.preventDefault();
    download(imgSrc, "file.png");
  };

  return (
    <main className="h-full w-full flex justify-center p-8 overflow-x-hidden">
      <div className="w-full container max-w-3xl">
        <div className="w-full">
          <form className="w-full flex flex-col" onSubmit={onSubmit}>
            <label htmlFor="csv" className="font-semibold mb-2 text-gray-700">
              Upload CSV:
            </label>
            <input id="csv" name="csv" type="file" accept="text/csv" className="pb-4" required />

            <div className="grid grid-cols-1 sm:grid-cols-2 mt-2 gap-x-8 gap-y-4">
              <div>
                <label htmlFor="minColor" className="font-semibold mb-2 text-gray-700">
                  Min value color:
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="minColor"
                    name="minColor"
                    defaultValue={colors.minColor}
                    required
                    onChange={onChangeColor}
                  />
                  <span className="ml-2 uppercase text-sm">{colors.minColor}</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxColor" className="font-semibold mb-2 text-gray-700">
                  Max value color:
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="maxColor"
                    name="maxColor"
                    defaultValue={colors.maxColor}
                    required
                    onChange={onChangeColor}
                  />
                  <span className="ml-2 uppercase text-sm">{colors.maxColor}</span>
                </div>
              </div>

              <div>
                <label htmlFor="width" className="block font-semibold mb-2 text-gray-700 mt-2">
                  Table width:
                </label>
                <div>
                  <input
                    type="number"
                    name="width"
                    id="width"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    defaultValue={dimensions.width}
                    min="100"
                    max="4000"
                    step="1"
                    onChange={onChangeDimension}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="height" className="block font-semibold mb-2 text-gray-700 mt-2">
                  Table height:
                </label>
                <div>
                  <input
                    type="number"
                    name="height"
                    id="height"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    defaultValue={dimensions.height}
                    min="100"
                    max="4000"
                    step="1"
                    onChange={onChangeDimension}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center items-center">
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none active:bg-indigo-500"
              >
                Generate Table
              </button>
            </div>
          </form>

          {imgSrc && (
            <div className="max-w-3xl object-contain my-4 pb-8 flex flex-col items-center">
              <img
                src={imgSrc}
                alt="Generated table"
                width={dimensions.width}
                height={dimensions.height}
              />

              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none active:bg-indigo-500 mt-4"
                onClick={onClickDownload}
              >
                Download Image
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
