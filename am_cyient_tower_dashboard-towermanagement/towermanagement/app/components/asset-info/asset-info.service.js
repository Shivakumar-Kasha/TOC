/**
 * @Date:   02-16-2017 11:02:18
 * @Project: AssetMonitoring
 * @Last modified time: 12-05-2017 15:08:11
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for vm-info server calls
 */
app.factory('AssetInfoService', function($http, CONFIG_DATA) {
  var assetInfo = {};

  /**
   * Service call to get devices From KAFKA
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetInfo.getAssetsVMService = function(tenantId, data) {
    var HEADERS = {
      "X-Kii-AppID": CONFIG_DATA.APP_ID,
      "X-Kii-AppKey": CONFIG_DATA.APP_KEY,
      "Content-Type": "application/json",
    };
    return $http
      .post(CONFIG_DATA.SERVICES.getAssets + tenantId, data, {
        headers: HEADERS
      });
  };

  /**
   * Service call to get asset information
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetInfo.getAssetInformation = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DASHBOARD.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get sensors information
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetInfo.getSensorsInformation = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_INFO.getSensorsInfo, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get sensor readings
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetInfo.getSensorReadings = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_INFO.getSensorReadings, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update base location
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetInfo.updateBaseLocation = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_INFO.updateBaseLocation, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return assetInfo;
});
