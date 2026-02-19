import { saveScanXmlToFolder } from "./backendApi";
import { readScanNameFromRawXml } from "../utils/xml/xmlScanName";

export async function saveRawXmlToPcFolder(rawXmlText) {
  const scanName = readScanNameFromRawXml(rawXmlText);
  return saveScanXmlToFolder({ scanName, xml: rawXmlText });
}
