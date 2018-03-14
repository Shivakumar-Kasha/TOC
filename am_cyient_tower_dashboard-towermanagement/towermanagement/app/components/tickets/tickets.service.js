/**
 * @Date:   01-27-2017 12:01:23
 * @Project: AssetMonitoring
 * @Last modified time: 07-03-2017 17:28:55
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for users server calls
 */
app.factory('ticketsService', function($window, $rootScope, $http, $translate, Session, CONFIG_DATA, AUTH_EVENTS, persistData, logReport, toastNotifier) {

  var ticketsServiceInfo = {};



  /**
   * Service call to update user information
   * @param  {JSON} data
   * @return {JSON} response
   */
  ticketsServiceInfo.editTicket = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.closeTicket, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };



  return ticketsServiceInfo;
});
