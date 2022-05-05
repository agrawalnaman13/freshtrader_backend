/**
 * @desc    This file contain Success and Error response for sending to client / user
 * @author  Neelesh Mishra
 * @since   2021
 */

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */

exports.success = function (message, results, statusCode) {
  return {
    error: false,
    error_code: statusCode,
    message,
    results,
  };
};

/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {number} statusCode
 */

exports.error = function (message, statusCode) {
  // List of common HTTP request code
  const codes = [200, 201, 400, 401, 412, 404, 403, 422, 500];

  //Get matched Code
  const findCode = codes.find((code) => code == statusCode);

  if (!findCode) statusCode = 500;
  else statusCode = findCode;

  return {
    error: true,
    error_code: statusCode,
    message,
    results: {},
  };
};

/**
 * @desc    Send any validation response
 *@param   {string} message
 * @param   {object | array} errors
 */

exports.validation = (message, errors) => {
  return {
    error: true,
    error_code: 422,
    message: message,
    errors,
  };
};
