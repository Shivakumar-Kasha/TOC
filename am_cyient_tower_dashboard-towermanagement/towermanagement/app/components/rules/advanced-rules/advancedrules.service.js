/**
 * @Date:   01-27-2017 12:01:02
 * @Project: 24/7PizzaBOX
 * @Last modified time: 04-11-2017 19:04:97
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for rules server calls
 */
app.factory('rulesService', function($window, $rootScope, $http, Session, CONFIG_DATA, AUTH_EVENTS) {
  var rulesServiceInfo = {};

  /**
   * Service call to check token is valid or not
   * @param  {JSON} data
   * @return {JSON} response
   */
  rulesServiceInfo.isValidToken = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.VALIDATION.validateToken, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return rulesServiceInfo;
});
