/**
 * Verify GIS Township Workbook V2.1 template headers and validator compatibility.
 * Prints GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE on success.
 */
import {
  BLOCK_HEADERS,
  AMENITY_HEADERS_V21,
} from '../src/services/layoutImport/workbookV21Constants.js';
import { LayoutImportValidator } from '../src/services/layoutImport/layoutImportValidator.js';
import { extractParsedSheets, readXlsxWorkbook } from '../src/services/layoutImport/workbookParseUtils.js';
import {
  buildV21TemplateWorkbook,
  readSheetHeaders,
  workbookToArrayBuffer,
  TEMPLATE_V21_MARKER,
} from '../src/services/layoutImport/workbookV21Template.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function headersMatch(actual, expected) {
  if (actual.length < expected.length) return false;
  return expected.every((header, index) => actual[index] === header);
}

async function validateWorkbookBuffer(buffer, label) {
  const workbook = readXlsxWorkbook(buffer);
  const parsed = extractParsedSheets(workbook, `${label}.xlsx`);
  const validation = await LayoutImportValidator.validateParsed(parsed);
  return { workbook, parsed, validation };
}

async function main() {
  const failures = [];

  try {
    const fullTemplate = buildV21TemplateWorkbook();
    const fullBuffer = workbookToArrayBuffer(fullTemplate);

    const blockHeaders = readSheetHeaders(fullTemplate, 'Blocks');
    const amenityHeaders = readSheetHeaders(fullTemplate, 'Amenities');

    assert(
      headersMatch(blockHeaders, BLOCK_HEADERS),
      `Blocks headers mismatch.\n  Expected: ${BLOCK_HEADERS.join(', ')}\n  Actual:   ${blockHeaders.join(', ')}`
    );

    assert(
      headersMatch(amenityHeaders, AMENITY_HEADERS_V21),
      `Amenities headers mismatch.\n  Expected: ${AMENITY_HEADERS_V21.join(', ')}\n  Actual:   ${amenityHeaders.join(', ')}`
    );

    assert(!blockHeaders.includes('Remarks'), 'Blocks sheet must not contain legacy Remarks column.');
    assert(
      blockHeaders.indexOf('Sequence') < blockHeaders.indexOf('BlockName'),
      'Blocks geometry columns (Sequence, Latitude, Longitude) must precede optional metadata.'
    );
    assert(
      amenityHeaders.indexOf('Sequence') < amenityHeaders.indexOf('Type'),
      'Amenities geometry columns must precede optional Type/Label metadata.'
    );

    const fullResult = await validateWorkbookBuffer(fullBuffer, 'full-template');
    assert(fullResult.validation.valid, `Full template validation failed: ${
      fullResult.validation.errors.map((e) => e.message).join('; ')
    }`);

    assert(fullResult.parsed.boundary?.length === 5, 'Boundary sample must have 5 closed vertices.');
    assert(fullResult.parsed.blocks?.length === 5, 'Blocks sample must have 5 closed vertices.');
    assert(fullResult.parsed.plotGeometry?.length === 5, 'PlotGeometry sample must have 5 closed vertices.');
    assert(fullResult.parsed.amenities?.length === 5, 'Amenities sample must have 5 closed vertices.');

    const headerOnlyTemplate = buildV21TemplateWorkbook({
      includeBlockSample: false,
      includeAmenitySample: false,
    });
    const headerOnlyBuffer = workbookToArrayBuffer(headerOnlyTemplate);
    const headerOnlyResult = await validateWorkbookBuffer(headerOnlyBuffer, 'header-only-optional');
    assert(
      headerOnlyResult.validation.valid,
      `Header-only Blocks/Amenities workbook must pass validation: ${
        headerOnlyResult.validation.errors.map((e) => e.message).join('; ')
      }`
    );
    assert(headerOnlyResult.parsed.blocks?.length === 0, 'Header-only Blocks must produce zero data rows.');
    assert(headerOnlyResult.parsed.amenities?.length === 0, 'Header-only Amenities must produce zero data rows.');

    console.log(TEMPLATE_V21_MARKER);
    console.log('GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE');
    console.log('Blocks headers:', blockHeaders.join(' | '));
    console.log('Amenities headers:', amenityHeaders.join(' | '));
    console.log('Full template validation: PASS');
    console.log('Header-only optional sheets validation: PASS');
  } catch (error) {
    failures.push(error.message || String(error));
  }

  if (failures.length) {
    console.error('GIS workbook template verification FAILED:');
    failures.forEach((msg) => console.error(` - ${msg}`));
    process.exit(1);
  }
}

main();
