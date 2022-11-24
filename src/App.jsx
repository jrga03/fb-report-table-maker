import { useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import get from "lodash/get";

import { download, getPercentageBetweenMinMax, interpolateColor } from "./utils";
import { generateImage } from "./generateImage";
import Form from "./Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const FORM_DEFAULT_VALUES = {
  width: 1000,
  height: 600,
  minColor: "#ffffff",
  maxColor: "#57bb8a",
  fontColor: "#003850",
  borderColor: "#cccccc",
  fontFamily: "sans-serif",
  fontSize: 18
};

function App() {
  const [imgSrc, setImgSrc] = useState(null);
  const [formKey, setFormKey] = useState();

  // useEffect(() => {
  //   (async function () {
  //     const fonts = await listFonts();
  //     console.log(fonts);
  //   })();
  // });

  const generateTable = (data, formData) => {
    const formattedFormData = {
      ...formData,
      width: Number.parseInt(formData.width),
      height: Number.parseInt(formData.height)
    };

    const dataUrl = generateImage(data, formattedFormData);
    setImgSrc(dataUrl);
  };

  const generateTableData = (data, formData) => {
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
    const minColor = formData.minColor.replace("#", "");
    const maxColor = formData.maxColor.replace("#", "");

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

    generateTable(colorTableData, formData);
  };

  const onParseComplete = (res, formData) => {
    let data = res.data;

    if (data?.[0]?.[0] === "sep=" && data?.[1]?.[0] === "Content") {
      data = data.slice(2);
    }

    const keys = data[0];

    console.log(keys);

    const hasPostTime = keys.includes("Post time") || keys.includes("Publish time");
    const hasReach = keys.includes("Reach") || keys.includes("People Reached");

    if (!hasPostTime || !hasReach) {
      alert(
        'Invalid CSV. \n\nData should have "Post time"/"Publish time" and "Reach"/"People Reached" as columns.'
      );
      return;
    }

    const values = data.slice(1);
    const dataObj = values
      .map((value) => {
        const entries = keys.map((key, index) => [key, value[index]]);
        return Object.fromEntries(entries);
      })
      .map((value) => {
        const postTime = get(value, "Post time", get(value, "Publish time"));
        const reach = get(value, "Reach", get(value, "People Reached"));

        const origPostTime = dayjs(postTime).tz("America/Los_Angeles", true).format();
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
          reach: Number.parseInt(reach, 10)
        };
      });

    generateTableData(dataObj, formData);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const formData = Object.fromEntries(form);

    Papa.parse(formData.csv, {
      skipEmptyLines: true,
      complete: (res) => onParseComplete(res, formData)
    });

    setFormKey(Date.now());
  };

  const onClickDownload = (e) => {
    e.preventDefault();
    download(imgSrc, "file.png");
  };

  return (
    <main className="h-full w-full flex justify-center p-8 overflow-x-hidden">
      <div className="w-full container max-w-3xl">
        <div className="w-full">
          <Form key={formKey} defaultValues={FORM_DEFAULT_VALUES} onSubmit={onSubmit} />

          {imgSrc && (
            <div className="w-full max-w-3xl object-contain my-4 pb-8 flex flex-col items-center">
              <img className="w-full" src={imgSrc} alt="Generated table" />

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
