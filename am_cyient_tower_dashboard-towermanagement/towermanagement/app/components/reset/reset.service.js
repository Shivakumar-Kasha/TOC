/**
 * @Date:   02-14-2017 17:02:50
 * @Project: 24/7PizzaBOX
 * @Last modified time: 05-15-2017 16:05:57
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for reset pasword server call
 */
app.factory('resetPassService', function($http, CONFIG_DATA) {
  var resetPassServiceInfo = {};

  /**
   * Service call to reset password
   * @param  {JSON} data
   * @return {JSON} response
   */
  resetPassServiceInfo.resetPassword = function(user) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.RESET_PASSWORD.method, user, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return resetPassServiceInfo;
});
