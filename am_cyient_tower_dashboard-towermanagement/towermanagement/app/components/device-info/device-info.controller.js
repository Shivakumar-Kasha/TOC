/**
 * @Author: santhoshbabu
 * @Date:   05-24-2017 17:46:22
 * @Project: Asset Monitoring
 * @Last modified time: 08-30-2017 21:06:50
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

angular.module('assetManagementApp').controller('DeviceInfoCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, CONFIG_DATA, AUTH_EVENTS, toastNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, devicesService, logReport, USER_ROLES) {

    $scope.tabs = [{
        heading: $translate.instant('LABELS.READINGS'),
        content: "device-readings",
        isLoaded: false
      },
      {
        heading: $translate.instant('LABELS.PROPERTIES'),
        content: "device-properties",
        isLoaded: false
      }
    ];

    $scope.setTabContent = function(name) {
      $scope.tabContentUrl = "components/device-info/" + name + ".html";
    };

    $rootScope.deviceId = JSON.parse($window.sessionStorage["sessionInfo"]).DeviceId

    var deviceProperties = "";
    var readings = "";
    var objectId = "";
    devicesService.getDevices({
      userToken: Session.token,
      filter: [{
        key: 'c_id',
        value: $rootScope.deviceId,
        filterType: 'eq'
      }]
    }).then(function(result) {
      var customInfo = {
        successMessage: "",
        alreadyExists: "",
        errorMessage: $translate.instant('DEVICES.ERROR.RETRIEVE_FAIL')
      };

      var validData = persistData.validifyData(result, customInfo);
      logReport.info("Device Information", JSON.stringify(result));
      if (Object.keys(validData).length !== 0) {
        deviceProperties = validData.data.records[0]._customInfo.customProperties;
        readings = validData.data.records[0]._customInfo.readings;
        $rootScope.deviceDisplayName = validData.data.records[0]._customInfo.c_name;
        objectId = validData.data.records[0].objectID;
        angular.extend($scope, {
          template: {
            form: {}
          },
          propertyKeys: [],
          max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES
        });
        $scope.addPropertyKey = function() {
          if ($scope.propertyKeys.length >= $scope.max_model_properties) {
            return false;
          }
          var newItemNo = $scope.propertyKeys[$scope.propertyKeys.length - 1] + 1;
          $scope.propertyKeys.push(newItemNo);
          //$scope.template[key[newItemNo-1].id].type="string";
        };

        $scope.removePropertyKey = function(removeItemKey) {
          var lastItem = $scope.propertyKeys.length - 1;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.propertyKeys.length; ind++) {
              if ($scope.propertyKeys[ind] !== removeItemKey) {
                tempKey[tempKey.length] = $scope.propertyKeys[ind];
              }
            }
            $scope.propertyKeys = tempKey;
            delete $scope.template.form[removeItemKey];
          }
        };

        //copy Device Property Label to Id

        $scope.copyPropertyLabel = function(propertyID, propertyKey) {
          var lastItem = $scope.propertyKeys.length - 0;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.propertyKeys.length; ind++) {
              if ($scope.propertyKeys[ind] !== propertyKey) {
                tempKey[tempKey.length] = $scope.propertyKeys[ind];
              }
            }

            var propertyIdToDisplay = propertyID.toLowerCase();
            var property = "";
            property = propertyIdToDisplay.replace(/[^A-Z0-9 ]/ig, "");
            propertyIdToDisplay = property.replace(/\s+/g, "-");
            $scope.template.form[propertyKey].propertyId = propertyIdToDisplay.trim();
          }
        }

        logReport.info("Properties Info :" + JSON.stringify(deviceProperties));
        angular.forEach(deviceProperties, function(property, index) {
          $scope.propertyKeys.push(index);

          $scope.template.form[index] = {
            label: property.label,
            type: property.type,
            hint: property.hint,
            propertyId: property.internal_name,
            required: property.required
          };
        });

        $scope.submit = function() {
          var deviceProperties = [];
          angular.forEach($scope.propertyKeys, function(key) {
            var required = "";
            var hint = "";
            if (persistData.isValid($scope.template.form[key].hint)) {
              hint = $scope.template.form[key].hint;
            } else {
              hint = "";
            }
            var label = $scope.template.form[key].label;
            deviceProperties.push({
              label: $scope.template.form[key].label,
              type: $scope.template.form[key].type,
              hint: hint,
              required: $scope.template.form[key].required,
              internal_name: $scope.template.form[key].propertyId,
            });
          });
          var data = {
            c_name: ""
          };
          data.customProperties = deviceProperties;
          data.readings = readings;
          var inputInfo = {
            userToken: Session.token,
            objectId: objectId,
            modelData: data
          };

          logReport.info("Input For Adding devices with properties" + JSON.stringify(inputInfo));
          devicesService.updateDeviceInformation(inputInfo).then(function(result) {
              var customInfo = {
                successMessage: $translate.instant('DEVICES.SUCCESS.UPDATION_SUCCESS'),
                alreadyExists: $translate.instant('DEVICES.ERROR.ALREADY_EXISTS'),
                errorMessage: $translate.instant('DEVICES.ERROR.UPDATION_FAIL')
              };
              var validData = persistData.validifyData(result, customInfo);
              if (Object.keys(validData).length !== 0) {}
            },
            function(error) {
              logReport.error("Add DEVICES Information", JSON.stringify(error));
              toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
            }
          );
        };
      }
    }, function(error) {
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });

    /**
     * Function to Edit Device information
     */
    $scope.editDeviceName = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'editDeviceNamePrompt.html',
        controller: 'EditDeviceNameCtrl',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          objectId: function() {
            return objectId;
          }
        }
      });
    };
  })

  .controller('EditDeviceReadingsCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, CONFIG_DATA, AUTH_EVENTS, toastNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, devicesService, logReport, USER_ROLES) {
    devicesService.getDevices({
      userToken: Session.token,
      filter: [{
        key: 'c_id',
        value: $rootScope.deviceId,
        filterType: 'eq'
      }]
    }).then(function(result) {
      var customInfo = {
        successMessage: "",
        alreadyExists: "",
        errorMessage: $translate.instant('DEVICES.ERROR.RETRIEVE_FAIL')
      };
      var deviceProperties = "";
      var readings = "";
      var validData = persistData.validifyData(result, customInfo);
      logReport.info("Device Reading Information", JSON.stringify(result));
      if (Object.keys(validData).length !== 0) {
        deviceProperties = validData.data.records[0]._customInfo.customProperties;
        readings = validData.data.records[0]._customInfo.readings;
        $rootScope.deviceDisplayName = validData.data.records[0]._customInfo.c_name;
        var objectId = validData.data.records[0].objectID;
        angular.extend($scope, {
          template: {
            form: {}
          },
          readingsArray: [],
          max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES

        });
        $scope.addReadingKey = function() {

          if ($scope.readingsArray.length >= $scope.max_model_properties) {
            return false;
          }
          var newItemNo = $scope.readingsArray[$scope.readingsArray.length - 1] + 1;
          $scope.readingsArray.push(newItemNo);
        };

        $scope.removeReadingKey = function(removeItemKey) {
          var lastItem = $scope.readingsArray.length - 1;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.readingsArray.length; ind++) {
              if ($scope.readingsArray[ind] !== removeItemKey) {
                tempKey[tempKey.length] = $scope.readingsArray[ind];
              }
            }
            $scope.readingsArray = tempKey;
            delete $scope.template.form[removeItemKey];
          }
        };
        //copy Device Reading Label to Id
        $scope.copyText = function(name, itemKey) {
          //  var regExp = /^[^`~!@#$%\^&*()_+={}|[\]\\:';"<>?,./1-9]*$/;
          var lastItem = $scope.readingsArray.length - 0;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.readingsArray.length; ind++) {
              if ($scope.readingsArray[ind] !== itemKey) {
                tempKey[tempKey.length] = $scope.readingsArray[ind];
              }
            }
            var nameToDisplay = name.toLowerCase();
            var id = "";
            id = nameToDisplay.replace(/[^A-Z0-9 ]/ig, "");
            nameToDisplay = id.replace(/\s+/g, "-");
            $scope.template.form[itemKey].id = nameToDisplay.trim();
          }
        }
        logReport.info("Readings Info :" + JSON.stringify(readings));
        angular.forEach(readings, function(reading, index) {
          $scope.readingsArray.push(index);
          $scope.template.form[index] = {
            displayName: reading.label,
            units: reading.units,
            readingType: reading.type,
            id: reading.internal_name
          };
        });

        $scope.submit = function() {
          var readings = [];
          angular.forEach($scope.readingsArray, function(key) {
            var required = "";
            var hint = "";
            if (persistData.isValid($scope.template.form[key].hint)) {
              hint = $scope.template.form[key].hint;
            } else {
              hint = "";
            }
            var label = $scope.template.form[key].displayName;
            readings.push({
              label: $scope.template.form[key].displayName,
              type: $scope.template.form[key].readingType,
              units: $scope.template.form[key].units,
              internal_name: $scope.template.form[key].id
            });
          });
          var data = {
            c_name: ""
          };
          data.customProperties = deviceProperties;
          data.readings = readings;
          var inputInfo = {
            userToken: Session.token,
            objectId: objectId,
            modelData: data
          };

          logReport.info("Input For Adding devices with properties" + JSON.stringify(inputInfo));
          devicesService.updateDeviceInformation(inputInfo).then(function(result) {
              var customInfo = {
                successMessage: $translate.instant('DEVICES.SUCCESS.UPDATION_SUCCESS'),
                alreadyExists: $translate.instant('DEVICES.ERROR.ALREADY_EXISTS'),
                errorMessage: $translate.instant('DEVICES.ERROR.UPDATION_FAIL')
              };
              var validData = persistData.validifyData(result, customInfo);
              if (Object.keys(validData).length !== 0) {}
            },
            function(error) {
              logReport.error("Add DEVICES Information", JSON.stringify(error));
              toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
            }
          );
        };
      }
    }, function(error) {
      toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
    });
  })

  /**
   * Controller to edit device name
   */
  .controller('EditDeviceNameCtrl', function($scope, $window, $rootScope, $translate, Session, persistData, logReport, toastNotifier, devicesService, CONFIG_DATA, objectId) {
    $scope.deviceNameToEdit = $rootScope.deviceDisplayName;
    $scope.submit = function() {
      var inputInfo = {
        userToken: Session.token,
        objectId: objectId,
        modelData: {
          c_name: $scope.deviceNameToEdit,
        }
      };
      logReport.info("Update Device Information", JSON.stringify(inputInfo));
      devicesService.updateDeviceInformation(inputInfo).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('DEVICES.SUCCESS.UPDATION_SUCCESS'),
            alreadyExists: $translate.instant('DEVICES.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('DEVICES.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          if (validData.status === CONFIG_DATA.SUCCESS) {
            $rootScope.deviceDisplayName = $scope.deviceNameToEdit;
          }
        },
        function(error) {
          logReport.error("Edit Device Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        });
    };
  });
