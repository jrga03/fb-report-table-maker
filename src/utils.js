import dayjs from "dayjs";
import get from "lodash/get";

import fonts from "./fonts.json";
import { generateImage } from "./generateImage";

export function interpolateColor(c0, c1, f) {
  c0 = c0.match(/.{1,2}/g).map((oct) => parseInt(oct, 16) * (1 - f));
  c1 = c1.match(/.{1,2}/g).map((oct) => parseInt(oct, 16) * f);
  let ci = [0, 1, 2].map((i) => Math.min(Math.round(c0[i] + c1[i]), 255));
  return ci
    .reduce((a, v) => (a << 8) + v, 0)
    .toString(16)
    .padStart(6, "0");
}

export function getPercentageBetweenMinMax(x, min, max) {
  return (x - min) / (max - min);
}

export function download(dataurl, filename) {
  const link = document.createElement("a");
  link.href = dataurl;
  link.download = filename;
  link.click();
}

const fontSet = new Set(fonts);

export async function listFonts() {
  await document.fonts.ready;

  const fontAvailable = new Set();

  for (const font of fontSet.values()) {
    if (document.fonts.check(`12px "${font}"`)) {
      fontAvailable.add(font);
    }
  }

  return [...fontAvailable.values()].sort();
}

export function onParseComplete(res) {
  let data = res.data;

  if (data?.[0]?.[0] === "sep=" && data?.[1]?.[0] === "Content") {
    data = data.slice(2);
  }

  const keys = data[0];

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
        reach: Number.parseInt(reach, 10),
      };
    });

  return dataObj;
}

function generateTableData(data, formData) {
  const tableData = Array.from({ length: 24 }, (_, index) =>
    data.reduce((acc, cur) => {
      if (cur.hour === index) {
        if (typeof acc[cur.dayOfWeek] === "undefined") {
          acc[cur.dayOfWeek] =
            formData.capMaxValue && cur.reach > Number(formData.maxValue)
              ? Number(formData.maxValue)
              : cur.reach;
        } else {
          acc[cur.dayOfWeek] +=
            formData.capMaxValue && cur.reach > Number(formData.maxValue)
              ? Number(formData.maxValue)
              : cur.reach;
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

  return colorTableData;
}

export function generateTable(data, formData) {
  const tableData = generateTableData(data, formData);

  const formattedFormData = {
    ...formData,
    width: Number.parseInt(formData.width),
    height: Number.parseInt(formData.height),
  };

  const dataUrl = generateImage(tableData, formattedFormData);
  return dataUrl;
}
