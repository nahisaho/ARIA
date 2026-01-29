export type DoclingConvertInput = {
  pdfPath: string;
  outputDir?: string;
};

export type DoclingConvertResult = {
  markdownPath: string;
  assetsDir?: string;
};

export type DoclingConvertErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_INSTALLED'
  | 'CONVERSION_FAILED'
  | 'UNKNOWN';

export type DoclingConvertError = {
  code: DoclingConvertErrorCode;
  message: string;
  details?: Record<string, unknown>;
};
