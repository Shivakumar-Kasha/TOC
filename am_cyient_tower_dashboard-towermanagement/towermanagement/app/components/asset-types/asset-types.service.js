/**
 * @Author: santhoshbabu
 * @Date:   05-24-2017 10:36:48
 * @Project: Asset Monitoring
 * @Last modified time: 06-06-2017 10:40:45
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for asset type server calls
 */
app.factory('assetTypeService', function($http, CONFIG_DATA) {
  var assetTypeServiceInfo = {};

  /**
   * Service call to add asset type
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetTypeServiceInfo.addAssetType = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_TYPES.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get asset types
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetTypeServiceInfo.getAssetTypes = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_TYPES.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get asset types
   * @param  {JSON} data
   * @return {JSON} response
   */
  assetTypeServiceInfo.deleteAssetType = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_TYPES.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };


  assetTypeServiceInfo.copyAssetTypesFromMaster = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.ASSET_TYPES.cloneAssetTypes, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return assetTypeServiceInfo;
});
