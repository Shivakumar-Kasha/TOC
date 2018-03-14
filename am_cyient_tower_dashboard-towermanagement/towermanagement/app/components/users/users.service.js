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
app.factory('usersService', function($window, $rootScope, $http, $translate, Session, CONFIG_DATA, AUTH_EVENTS, persistData, logReport, toastNotifier) {

  var usersServiceInfo = {};

  /**
   * Service call to add user information
   * @param  {JSON} data
   * @return {JSON} response
   */
  usersServiceInfo.addUser = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get users information
   * @param  {JSON} data
   * @return {JSON} response
   */
  usersServiceInfo.getUsers = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update user information
   * @param  {JSON} data
   * @return {JSON} response
   */
  usersServiceInfo.editUser = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.putMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update user advance information
   * @param  {JSON} data
   * @return {JSON} response
   */
  usersServiceInfo.updateUserAdvanced = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.advanceUpdateMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete user information
   * @param  {JSON} data
   * @return {JSON} response
   */
  usersServiceInfo.deleteUser = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.USERS.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };



  return usersServiceInfo;
});
