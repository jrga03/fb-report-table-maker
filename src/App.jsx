import { useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { download, generateTable, onParseComplete } from "./utils";
import Form from "./Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const FORM_DEFAULT_VALUES = {
  width: 1000,
  height: 600,
  minColor: "#ffffff",
  maxColor: "#007789",
  fontColor: "#003850",
  borderColor: "#cccccc",
  fontFamily: "sans-serif",
  fontSize: 18,
  capMaxValue: false,
  maxValue: 1000,
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

  const onSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const formData = Object.fromEntries(form);

    Papa.parse(formData.csv, {
      skipEmptyLines: true,
      complete: (res) => {
        const csvData = onParseComplete(res);
        const tableImg = generateTable(csvData, formData);
        setImgSrc(tableImg);
      },
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
