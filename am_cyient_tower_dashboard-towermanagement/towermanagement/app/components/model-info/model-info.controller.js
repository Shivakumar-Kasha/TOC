/**
 * @Author: santhoshbabu
 * @Date:   05-24-2017 17:46:22
 * @Project: Asset Monitoring
 * @Last modified time: 12-05-2017 15:54:24
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

angular.module('assetManagementApp').controller('ModelInfoCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, CONFIG_DATA, AUTH_EVENTS, toastNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, logReport, modelsService, sensorService, assetTypeService, USER_ROLES) {

    $scope.tabs = [{
        heading: $translate.instant('LABELS.DEVICES'),
        content: "model-devices",
        isLoaded: false
      },
      {
        heading: $translate.instant('LABELS.PROPERTIES'),
        content: "model-properties",
        isLoaded: false
      }
    ];

    $scope.setTabContent = function(name) {
      $scope.tabContentUrl = "components/model-info/" + name + ".html";
    };
    $rootScope.modelId = JSON.parse($window.sessionStorage["sessionInfo"]).ModelId;

    var draw = null;
    var modelInfo = this;
    modelInfo.dtInstance = {};
    modelInfo.devices = {};
    modelInfo.unassign = unassignDevice;
    $.fn.dataTable.ext.errMode = 'none';

    modelInfo.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.getModelDetails,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.filter = [];
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.c_id = $rootScope.modelId;

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.sensor.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.sensor.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get Device Query", JSON.stringify(d));

          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get Device1213 Information", JSON.stringify(response));
            modelInfo.devices = [];
            modelsService.getModels({
              userToken: Session.token,
              filter: [{
                key: 'c_id',
                value: $rootScope.modelId,
                filterType: 'eq'
              }]
            }).then(function(result) {
              var customInfo = {
                successMessage: "",
                alreadyExists: "",
                errorMessage: $translate.instant('MODELS.ERROR.RETRIEVE_FAIL')
              };

              var validData = persistData.validifyData(result, customInfo);
              logReport.info("Model Information", JSON.stringify(result));
              if (Object.keys(validData).length !== 0) {
                $rootScope.modelDisplayName = validData.data.records[0]._customInfo.c_name;
              }
            }, function(error) {
              toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
            });

            var devicesList = response.data;
            if (devicesList.length !== 0) {
              response.data = [];
              angular.forEach(devicesList, function(device) {
                device['c_name'] = device.c_name;
                device['units'] = device.units;
                response.data.push(device);
              });
            }
            logReport.info("Get Device Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Device Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      })
      .withDataProp(function(data) {
        return data.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', {
        details: {
          renderer: function(api, rowIndex) {
            var data = dataTable.rendererRows(api, rowIndex);
            // gets the table and append the rows
            var table = angular
              .element('<table/>')
              .append(data);

            // compile the table to keep the events
            $compile(table.contents())($scope);
            return table;
          }
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('serverSide', true);

    modelInfo.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      modelInfo.devices[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="modelInfo.unassign(modelInfo.devices[' + data.id + '])" )"="" ng-disabled = "{{disableUnassignButtonForTenant}}">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button></div>';
    }

    if (Session.tenantType === USER_ROLES.tenant) {
      $scope.disableUnassignButtonForTenant = "true";
    }
    $scope.openAddSensorPrompt = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addDevicePrompt.html',
        controller: 'ShowDevicesInstanceCtrl as showDevices',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          modelInfo: function() {
            return modelInfo;
          }
        }
      });
    };
    /**
     * Function to Edit Model information
     */
    $scope.editModelName = function() {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'editModelNamePrompt.html',
        controller: 'EditModelNameCtrl',
        windowClass: 'modal-fit',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          assetId: function() {
            return $rootScope.assetTypeId;
          }
        }
      });
    };
    /**
     * Function to delete device information
     * @param  {JSON} deviceInfo
     */
    function unassignDevice(deviceInfo) {
      logReport.info("DeviceInfo" + JSON.stringify(deviceInfo));
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteDeviceFromModelPrompt.html',
        controller: 'UnAssignDeviceCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          deviceInfo: function() {
            return deviceInfo;
          },
          modelInfo: function() {
            return modelInfo;
          }
        }
      });
    }
  })

  /**
   * Controller to add or edit model properties
   */
  .controller('EditModelPropertiesCtrl', function($rootScope, $scope, $compile, $sanitize, $translate, $q, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, modelsService, assetTypeService, utilityFunctions, USER_ROLES) {

    if (Session.tenantType === USER_ROLES.master) {
      $rootScope.enableToMaster = "false";
    } else {
      $rootScope.enableToMaster = "true";
    }
    var modelProperties = "";
    var devices = "";
    modelsService.getModels({
      userToken: Session.token,
      filter: [{
        key: 'c_id',
        value: $rootScope.modelId,
        filterType: 'eq'
      }]
    }).then(function(result) {
      var customInfo = {
        successMessage: "",
        alreadyExists: "",
        errorMessage: $translate.instant('MODELS.ERROR.RETRIEVE_FAIL')
      };

      var validData = persistData.validifyData(result, customInfo);
      logReport.info("Model Information", JSON.stringify(result));
      if (Object.keys(validData).length !== 0) {
        modelProperties = validData.data.records[0]._customInfo.customProperties;
        devices = validData.data.records[0]._customInfo.devices;
        var modelName = validData.data.records[0]._customInfo.c_name;
        angular.extend($scope, {
          template: {
            form: {}
          },
          keys: [],
          max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES

        });

        $scope.addKey = function() {
          if ($scope.keys.length >= $scope.max_model_properties) {
            return false;
          }
          var newItemNo = $scope.keys[$scope.keys.length - 1] + 1;
          $scope.keys.push(newItemNo);
          //$scope.template[key[newItemNo-1].id].type="string";
        };

        $scope.removeKey = function(removeItemKey) {
          var lastItem = $scope.keys.length - 1;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.keys.length; ind++) {
              if ($scope.keys[ind] !== removeItemKey) {
                tempKey[tempKey.length] = $scope.keys[ind];
              }
            }
            $scope.keys = tempKey;
            delete $scope.template.form[removeItemKey];
          }
        };

        //copy Device Property Label to Id

        $scope.copyPropertyLabel = function(propertyID, propertyKey) {
          var lastItem = $scope.keys.length - 0;
          if (lastItem > 0) {
            var tempKey = [];
            for (var ind = 0; ind < $scope.keys.length; ind++) {
              if ($scope.keys[ind] !== propertyKey) {
                tempKey[tempKey.length] = $scope.keys[ind];
              }
            }
            var propertyIdToDisplay = propertyID.toLowerCase();
            var property = "";
            property = propertyIdToDisplay.replace(/[^A-Z0-9 ]/ig, "");
            propertyIdToDisplay = property.replace(/\s+/g, "-");
            $scope.template.form[propertyKey].propertyId = propertyIdToDisplay.trim();
          }
        }

        angular.forEach(modelProperties, function(model, index) {
          $scope.keys.push(index);
          // var labelData = utilityFunctions.capitalizeFirstLetter(model.label);
          // alert(labelData)
          $scope.template.form[index] = {
            label: model.label,
            type: model.type,
            hint: model.hint,
            propertyId: model.internal_name,
            required: model.required
          };
        });

        $scope.submit = function() {
          var modelProperties = [];
          angular.forEach($scope.keys, function(key) {
            var required = "";
            var hint = "";
            if (persistData.isValid($scope.template.form[key].hint)) {
              hint = $scope.template.form[key].hint;
            } else {
              hint = "";
            }
            var label = $scope.template.form[key].label;
            modelProperties.push({
              label: $scope.template.form[key].label,
              internal_name: $scope.template.form[key].propertyId,
              type: $scope.template.form[key].type,
              hint: hint,
              required: $scope.template.form[key].required
            });
          });
          var data = {};
          data.customProperties = modelProperties;
          data.devices = devices;
          var inputInfo = {
            userToken: Session.token,
            c_id: $rootScope.modelId,
            modelData: data
          };

          logReport.info("Input For Adding Model with properties" + JSON.stringify(inputInfo));
          modelsService.updateModel(inputInfo).then(function(result) {
              var customInfo = {
                successMessage: $translate.instant('MODELS.SUCCESS.UPDATION_SUCCESS'),
                alreadyExists: $translate.instant('MODELS.ERROR.ALREADY_EXISTS'),
                errorMessage: $translate.instant('MODELS.ERROR.UPDATION_FAIL')
              };
              var validData = persistData.validifyData(result, customInfo);
              if (Object.keys(validData).length !== 0) {}
            },
            function(error) {
              logReport.error("Add Model Information", JSON.stringify(error));
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
   * Controller to add devices
   */
  .controller('ShowDevicesInstanceCtrl', function($rootScope, $scope, $compile, $sanitize, $uibModalInstance, $translate, $q, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, modelInfo, modelsService, DTOptionsBuilder, DTColumnBuilder, eachSeries) {

    $scope.Add_or_Update_Model = 'Add';
    $scope.Add_or_Update = $translate.instant('CRUD.ADD');
    var draw = null;
    var device = this;
    device.selected = {};
    device.selectAll = false;
    device.toggleAll = toggleAll;
    device.toggleOne = toggleOne;
    device.dtInstance = {};
    device.selectedSensors = {};
    $scope.assetDetails = {};
    var deviceDetails = [];
    $scope.selectedData = [];
    var titleHtml = '<label class="checkbox-inline checkbox-custom-alt text-center"><input type="checkbox" ng-model="showDevices.selectAll" ng-click="showDevices.toggleAll(showDevices.selectAll, showDevices.selected)"><i></i></label>';

    $.fn.dataTable.ext.errMode = 'none';
    logReport.info("@@@@@@@@@@@@@@@@@@@@", JSON.stringify(modelInfo.devices));
    device.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.filter = [];
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          angular.forEach(modelInfo.devices, function(device) {
            var deviceId = device.c_id;
            deviceDetails.push(deviceId);
          });

          d.filter = [{
            key: 'c_id',
            value: (deviceDetails.length !== 0) ? deviceDetails : [''],
            filterType: 'notincl'
          }];

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.sensor.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.sensor.filterType
            };
            d.filter.push(search);
          }
          logReport.info("Get modelinfo Query", JSON.stringify(d));
          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get devices For model", JSON.stringify(response));
            device.selected = [];
            device.selectAll = (response.data.length > 0);
            angular.forEach(response.data, function(data, key) {
              var index = $scope.selectedData.indexOf(data.c_id);
              if (index < 0) {
                device.selectAll = false;
              }
            });
            return response;
          }
        }
      })
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', true)
      .withOption('createdRow', createdRow)
      .withOption('headerCallback', function(header) {
        if (!device.headerCompiled) {
          // Use this headerCompiled field to only compile header once
          device.headerCompiled = true;
          $compile(angular.element(header).contents())($scope);
        }
      })
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('serverSide', true);

    device.dtColumns = [
      DTColumnBuilder.newColumn('c_name'),
      DTColumnBuilder.newColumn('units'),
      DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
      .renderWith(function(data, type, full, meta) {
        device.selected[full.id] = false;
        device.selectedSensors[data.id] = data;
        var index = $scope.selectedData.indexOf(data.c_id);
        if (index > -1) {
          device.selected[data.id] = true;
        }
        return '<label class="checkbox-inline checkbox-custom-alt text-center"><input type="checkbox" ng-model="showDevices.selected[' + data.id + ']" ng-click="showDevices.toggleOne(showDevices.selected)"><i></i></label>';
      }),
    ];


    function toggleAll(selectAll, selectedItems) {
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          selectedItems[id] = selectAll;
        }
      }
      var data = device.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index < 0) {
            $scope.selectedData.push(device.selectedSensors[key].c_id);
          }
        } else {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
    }

    function toggleOne(selectedItems) {
      // console.log(JSON.stringify(selectedItems));
      var data = device.selected;
      angular.forEach(data, function(value, key) {
        if (data[key] === true) {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index < 0) {
            $scope.selectedData.push(device.selectedSensors[key].c_id);
          }
        } else {
          var index = $scope.selectedData.indexOf(device.selectedSensors[key].c_id);
          if (index > -1) {
            $scope.selectedData.splice(index, 1);
          }
        }
      });
      for (var id in selectedItems) {
        if (selectedItems.hasOwnProperty(id)) {
          if (!selectedItems[id]) {
            device.selectAll = false;
            return;
          }
        }
      }
      device.selectAll = true;
    }

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    //Adding Devices
    $scope.submit = function() {
      var data = device.selected;
      var details = [];
      var details1 = [];
      var devices = [];
      var totalCount = 0;
      var successCount = 0;
      var failCount = 0;

      angular.forEach($scope.selectedData, function(value, key) {
        // var modelData = {
        //   //  c_name: $rootScope.modelNameForSensorAdding,
        //   deviceId: $scope.selectedData[key]
        //   devices.push(deviceId);
        // };
        var data = {
          userToken: Session.token,
          //  userIdToAssign: $scope.selectedData[key],
          c_id: $rootScope.modelId,
          modelData: {
            devices: [$scope.selectedData[key]]
          }
        };
        logReport.info("Add devices Information", JSON.stringify(data));
        details.push(data);
      });

      /**
       * Add multiple devices(s) in a sequential order
       * @param  {JSON} data
       */
      eachSeries(details, function(data) {
        return modelsService.addDevicesToModel(data).then(function(result) {

            logReport.info("Add Devices Information Response", JSON.stringify(result));

            var customInfo = {
              successMessage: '',
              alreadyExists: '',
              errorMessage: ''
            };

            var validData = persistData.validifyData(result, customInfo);

            if (Object.keys(validData).length !== 0) {
              successCount++;
            } else {
              failCount++;
            }
            totalCount++;
          },
          function(error) {
            logReport.error("Add Devices(s) To Model", JSON.stringify(error));
            toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
          }
        );
      }).then(function() {
        // All done
        if (totalCount === failCount) {
          toastNotifier.showError($translate.instant('MODELS.ERROR.DEVICES_ADD_FAIL'));
        } else {
          toastNotifier.showSuccess(successCount + ' out of ' + totalCount + ' ' + $translate.instant('MODELS.SUCCESS.DEVICES_ADD_SUCCESS'));
        }
        modelInfo.dtInstance.reloadData(null, false);
        $rootScope.modalInstance.close();
      });
    };
  })

  /**
   * Controller to delete device information
   */
  .controller('UnAssignDeviceCtrl', function($scope, $rootScope, $translate, Session, toastNotifier, devicesService, persistData, logReport, deviceInfo, modelInfo) {

    $scope.deleteDeviceName = deviceInfo.c_name;
    var devices = [];
    $scope.deleteDeviceFromModel = function() {

      devices.push(deviceInfo.c_id);
      var modelData = {
        devices: devices
      };

      devicesService.deleteDeviceFromModel({
        userToken: Session.token,
        c_id: $rootScope.modelId,
        modelData: modelData
      }).
      then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('DEVICES.SUCCESS.DELETION_SUCCESS'),
            alreadyExists: '',
            errorMessage: $translate.instant('DEVICES.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);

          if (Object.keys(validData).length !== 0) {
            modelInfo.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Delete Device Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    };
  })

  /**
   * Controller to edit model name
   */
  .controller('EditModelNameCtrl', function($scope, $window, $rootScope, $translate, Session, persistData, logReport, toastNotifier, modelsService, assetId, CONFIG_DATA) {
    $scope.modelName = $rootScope.modelDisplayName;

    $scope.submit = function() {
      var inputInfo = {
        userToken: Session.token,
        c_id: $rootScope.modelId,
        modelData: {
          c_name: $scope.modelName,
        }
      };
      logReport.info("Update Model Information", JSON.stringify(inputInfo));
      modelsService.updateModel(inputInfo).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('MODELS.SUCCESS.UPDATION_SUCCESS'),
            alreadyExists: $translate.instant('MODELS.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('MODELS.ERROR.UPDATION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          if (validData.status === CONFIG_DATA.SUCCESS) {
            $rootScope.modelDisplayName = $scope.modelName;
          }
        },
        function(error) {
          logReport.error("Edit Zone Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        });
    };
  });
