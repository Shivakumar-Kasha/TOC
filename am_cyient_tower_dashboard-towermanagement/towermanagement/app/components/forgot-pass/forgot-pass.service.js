/**
 * @Date:   02-14-2017 17:02:50
 * @Project: 24/7PizzaBOX
 * @Last modified time: 06-07-2017 13:02:40
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for forgot pasword server call
 */
app.factory('forgotPassService', function($http, CONFIG_DATA) {
  var forgotPassServiceInfo = {};

  /**
   * Service call to send forgot password link to given mail
   * @param  {JSON} data
   * @return {JSON} response
   */
  forgotPassServiceInfo.forgotPassword = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.FORGOT_PASSWORD.method, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return forgotPassServiceInfo;
});
