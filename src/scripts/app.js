import { wavParser } from "./wavParser";
const filesInput = document.getElementById("input-files");
const convertBtn = document.getElementById("btn-convert");
const fileList = document.getElementById("file-list");

filesInput.onchange = (ev) => {
  console.log(ev);

  fileList.innerHTML = [...filesInput.files]
    .map((file) => `<div> ${file.name}</div>`)
    .join("\n");
};

const validateWav = (o) => {
  const { rawData, filename } = o;

  const header = wavParser(rawData);
  console.log(header);

  if (!header) {
    console.error({ header, filename });
    return {
      ...o,
      isValid: false,
      errorMessage: `Parsing error happened in ${filename}`
    };
  }

  return { ...o, isValid: true };
};

function convertFile(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.readAsBinaryString(file);

    reader.onload = () => {
      let binaryData = reader.result;

      const fileConcat = convertToHex(binaryData);
      resolve(
        validateWav({
          rawData: binaryData,
          hexData: fileConcat,
          filename: file.name
        })
      );
    };

    reader.onerror = () => reject(reader.error);
  });
}

async function convert() {
  if (filesInput.files.length === 0) {
    alert("No files chosen!");
    return;
  }

  const hexifiedItemsPromises = [...filesInput.files].map(convertFile);
  const hexifiedItems = await Promise.all(hexifiedItemsPromises);
  const anyErrors = hexifiedItems.filter((x) => !x.isValid);
  if (anyErrors.length !== 0) {
    alert(anyErrors.map((x) => x.errorMessage).join("\n"));
    console.error({ anyErrors });
    return;
  }

  const concated = hexifiedItems.map((x) => x.hexData).join("\n\n\n\n");
  //console.log({ concated });

  const url = URL.createObjectURL(
    new Blob([concated], { type: "text/plain;charset=utf-8" })
  );
  const result = document.getElementById("result");
  result.setAttribute("href", url);
  result.click();

  // convertFile(files);
}

function convertToHex(file) {
  return Array.from(file, (_, i) =>
    file.charCodeAt(i).toString(16).padStart(2, "0")
  ).join(" ");
}

convertBtn.addEventListener("click", convert);
