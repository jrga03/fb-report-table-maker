const Form = ({ onSubmit, defaultValues }) => {
  return (
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
              defaultValue={defaultValues.minColor}
              required
            />
            <span className="ml-2 uppercase text-sm">{defaultValues.minColor}</span>
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
              defaultValue={defaultValues.maxColor}
              required
            />
            <span className="ml-2 uppercase text-sm">{defaultValues.maxColor}</span>
          </div>
        </div>

        <div>
          <label htmlFor="width" className="block font-semibold mb-2 text-gray-700">
            Table width:
          </label>
          <div>
            <input
              type="number"
              name="width"
              id="width"
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              defaultValue={defaultValues.width}
              min="100"
              max="4000"
              step="1"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="height" className="block font-semibold mb-2 text-gray-700">
            Table height:
          </label>
          <div>
            <input
              type="number"
              name="height"
              id="height"
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              defaultValue={defaultValues.height}
              min="100"
              max="4000"
              step="1"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="fontColor" className="font-semibold mb-2 text-gray-700">
            Font color:
          </label>
          <div className="flex items-center">
            <input
              type="color"
              id="fontColor"
              name="fontColor"
              defaultValue={defaultValues.fontColor}
              required
            />
            <span className="ml-2 uppercase text-sm">{defaultValues.fontColor}</span>
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
  );
};

export default Form;
