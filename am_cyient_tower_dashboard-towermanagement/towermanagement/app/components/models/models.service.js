/**
 * @Date:   01-30-2017 17:01:66
 * @Project: 24/7PizzaBOX
 * @Last modified time: 05-29-2017 15:21:22
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for models server calls
 */
app.factory('modelsService', function($window, $rootScope, $http, Session, CONFIG_DATA, AUTH_EVENTS) {
  var modelsServiceInfo = {};

  /**
   * Service call to add model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.addModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get models information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.getModels = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get specific model  information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.getModelDetails = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.getModelDetails, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.updateModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.putMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };


  /**
   * Service call to add sensors to  model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.addDevicesToModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.addDevicesToModel, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.deleteModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to clone models from master to tenant
   * @param  {JSON} data
   * @return {JSON} response
   */
  modelsServiceInfo.copyModelsFromMaster = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.cloneModels, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return modelsServiceInfo;
});
