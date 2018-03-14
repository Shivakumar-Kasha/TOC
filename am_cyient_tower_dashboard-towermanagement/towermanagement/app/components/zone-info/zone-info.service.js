/**
 * @Date:   01-27-2017 12:01:86
 * @Project: 24/7PizzaBOX
 * @Last modified time: 06-05-2017 18:02:50
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for zone-info server calls
 */
app.factory('zoneInfoService', function($http, CONFIG_DATA) {
  var zoneInformationService = {};

  /**
   * Service call to assign user to zone
   * @param  {JSON} data
   * @return {JSON} response
   */
  zoneInformationService.assignUserToZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONE_INFO.USERS.assignMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to assign machine to zone
   * @param  {JSON} data
   * @return {JSON} response
   */
  zoneInformationService.assignAssetToZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONE_INFO.ASSETS.assignMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to unassign user from zone
   * @param  {JSON} data
   * @return {JSON} response
   */
  zoneInformationService.unAssignUserFromZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONE_INFO.USERS.unassignMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to unassign machine from zone
   * @param  {JSON} data
   * @return {JSON} response
   */
  zoneInformationService.unAssignAssetFromZone = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ZONE_INFO.ASSETS.unassignMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return zoneInformationService;
});
