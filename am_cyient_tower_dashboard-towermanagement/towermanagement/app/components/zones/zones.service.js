/**
 * @Date:   01-27-2017 12:01:27
 * @Project: 24/7PizzaBOX
 * @Last modified time: 04-11-2017 14:04:40
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for zones server calls
 */
app.factory('zonesService', function($window, $rootScope, $http, $translate, Session, toastr, CONFIG_DATA, AUTH_EVENTS) {

  var zonesServiceInfo = {};

  /**
   * Service call to add zone information
   * @param  {JSON} data
   * @return {JSON} response
   */
  zonesServiceInfo.addZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONES.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get zones information
   * @param  {JSON} data
   * @return {JSON} response
   */
  zonesServiceInfo.getZones = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONES.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update zone information
   * @param  {JSON} data
   * @return {JSON} response
   */
  zonesServiceInfo.updateZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONES.putMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete zone information
   * @param  {JSON} data
   * @return {JSON} response
   */
  zonesServiceInfo.deleteZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONES.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return zonesServiceInfo;
});
