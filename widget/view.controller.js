/* Copyright start
  Copyright (C) 2008 - 2023 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
    'use strict';
    (function () {
        angular
            .module('cybersponse')
            .controller('fortiAIConfiguration100Ctrl', fortiAIConfiguration100Ctrl);

        fortiAIConfiguration100Ctrl.$inject = ['$scope', 'API', '$rootScope', '$http', '$q', '$resource', 'toaster', 'WizardHandler', '$window', '_', 'currentPermissionsService',  'marketplaceService', 'connectorService', 'CommonUtils', '$controller', 'widgetBasePath'];

        function fortiAIConfiguration100Ctrl($scope, API, $rootScope, $http, $q, $resource, toaster, WizardHandler, $window, _, currentPermissionsService, marketplaceService, connectorService, CommonUtils, $controller, widgetBasePath) {
          $controller('BaseConnectorCtrl', {
            $scope: $scope
          });
          $scope.entity = {};
          $scope.keyStoreValue = {};
          $scope.llmIntegrationData = {};
          $scope.moveNext = moveNext;
          $scope.moveBack = moveBack;
          $scope.updateLLMIntegrationData = updateLLMIntegrationData;
          $scope.saveConnectorConfiguration = saveConnectorConfiguration;
          $scope.defaultLLMIntegration = {};
          $scope.isLightTheme = $rootScope.theme.id === 'light';
          $scope.startInfoGraphics = $scope.isLightTheme ? widgetBasePath +'images/fortiAI-start-light.png': widgetBasePath +'images/fortiAI-start-dark.png';
          $scope.connectLLMInfoGraphics = $scope.isLightTheme ? widgetBasePath +'images/fortiAI-connect-llm-light.png': widgetBasePath +'images/fortiAI-connect-llm-dark.png';
          init()
          function init() {
            $scope.llmIntegrationData = constants()
            $scope.defaultLLMIntegration = $scope.llmIntegrationData.defaultLLMIntegration
            getKeyStoreRecord($scope.llmIntegrationData.queryForKeyStore, 'keys').then(function (response) {
              if (response['hydra:member'] && (response['hydra:member'][0])) {
                $scope.entity = response;
                $scope.keyStoreValue = $scope.entity['hydra:member'][0].jSONValue;
              }
              else {
                toaster.error({ body: "Key Store record not found, refer documentation" });
              }
            })
          }

          function getKeyStoreRecord(queryObject, module) {
            var defer = $q.defer();
            var url = API.QUERY + module;
            $resource(url).save(queryObject, function (response) {
                defer.resolve(response);
            }, function (err) {
                defer.reject(err);
            })
            return defer.promise;
          }

          function moveNext() {
            var currentStepTitle = WizardHandler.wizard('fortiAIConfiguration').currentStep().wzTitle
            if (currentStepTitle === 'Start') {
              updateLLMIntegrationData('load')
            }
            if (currentStepTitle === 'Configuration') {
              updateKeyStoreValue()  
              _loadConnectorData($scope.keyStoreValue.llmIntegrationToUse)
            }
            if (currentStepTitle === 'Finish') {
              updateConfigurationRecord()
            }
            WizardHandler.wizard('fortiAIConfiguration').next();
          }

          function _loadConnectorData(connectorName) {
            var queryPayload =
            {
              "page": 1,
              "limit": 30,
              "logic": "AND",
              "filters": [
                  {
                      "field": "name",
                      "operator": "eq",
                      "value": connectorName
                  }
              ]
            }
            var queryUrl = API.QUERY + 'solutionpacks?$limit=30&$page=1';
            $http.post(queryUrl, queryPayload).then(function (response) {
              if (response.data['hydra:totalItems'] === 0) {
                toaster.error({
                  body: 'The Connector "' + connectorName + '" is not installed. Install the connector and re-run this wizard to complete the configuration'
                });
                return;
              }
              $scope.selectedConnector = response.data['hydra:member'][0]
              $scope.loadConnector($scope.selectedConnector, false, false);
              $scope.processingConnector = false;
              _loadConnectorDetails($scope.selectedConnector.uuid)
            });
          }

          function _loadConnectorDetails(connectorUUID) {
            $scope.processingConnector = true;
            $scope.configuredConnector = false;
            $scope.isConnectorHealthy = false;
            marketplaceService.getContentDetails(API.BASE + 'solutionpacks/' + connectorUUID + '?$relationships=true').then(function (response) {
              $scope.contentDetail = response.data;
              if(connector.configuration.length > 0){
                $scope.isConnectorConfigured = true;
                connectorService.getConnectorHealth(response.data, $scope.selectedConnector.configuration[0].config_id, $scope.selectedConnector.configuration[0].agent).then(function (data) {
                if (data.status === "Available") {
                  $scope.isConnectorHealthy = true;
                }
                });
              }
              else{
                $scope.isConnectorConfigured = false;
              }
            });
          }

          function saveConnectorConfiguration(saveFrom) {
            $scope.isConnectorConfigured = true;
            $scope.configuredConnector = false;
            var data = angular.copy($scope.connector);
            if (CommonUtils.isUndefined(data)) {
              $scope.statusChanged = false;
              return;
            }
            if (!currentPermissionsService.availablePermission('connectors', 'update')) {
              $scope.statusChanged = false;
              return;
            }
      
            var newConfiguration, newConfig, deleteConfig;
            newConfiguration = false;
            if (saveFrom !== 'deleteConfigAndSave') {
              if (!_.isEmpty($scope.connector.config_schema)) {
                if (!$scope.validateConfigurationForm()) {
                  return;
                }
              }
              if (!$scope.input.selectedConfiguration.id) {
                newConfiguration = true;
                $scope.input.selectedConfiguration.config_id = $window.UUID.generate();
                if ($scope.input.selectedConfiguration.default) {
                  angular.forEach(data.configuration, function (configuration) {
                    if (configuration.config_id !== $scope.input.selectedConfiguration.config_id) {
                      configuration.default = false;
                    }
                  });
                }
                data.configuration.push($scope.input.selectedConfiguration);
                newConfig = $scope.input.selectedConfiguration;
              }
              delete data.newConfig;
            }
      
            if (saveFrom === 'deleteConfigAndSave') {
              $scope.isConnectorConfigured = false;
              deleteConfig = true;
              $scope.isConnectorHealthy = false;
            }
      
            var updateData = {
              connector: data.id,
              name: $scope.input.selectedConfiguration.name,
              config_id: $scope.input.selectedConfiguration.config_id,
              id: $scope.input.selectedConfiguration.id,
              default: $scope.input.selectedConfiguration.default,
              config: {},
              teams: $scope.input.selectedConfiguration.teams
            };
            $scope.saveValues($scope.input.selectedConfiguration.fields, updateData.config);
            $scope.processing = true;
            connectorService.updateConnectorConfig(updateData, newConfiguration, deleteConfig).then(function (response) {
              if (newConfig) {
                $scope.connector.configuration.push(newConfig);
                if (newConfig.default) {
                  $scope.removeDefaultFromOthers();
                }
      
              }
              $scope.formHolder.connectorForm.$setPristine();
              if (!deleteConfig) {
                $scope.input.selectedConfiguration.id = response.id;
                $scope.configuredConnector = true;
                $scope.isConnectorHealthy = true;
              }
              $scope.checkHealth();
              $scope.statusChanged = false;
            }, function (error) {
              toaster.error({
                body: error.data.message ? error.data.message : error.data['hydra:description']
              });
            }).finally(function () {
              $scope.processing = false;
            });
          }

          function updateLLMIntegrationData(action) {
            var llmIntegrationToUse;
            var llMIntegrationDict;
        
            if (action === 'load') {
                llmIntegrationToUse = $scope.keyStoreValue.llmIntegrationToUse;
                llMIntegrationDict = $scope.keyStoreValue.llmIntegrations.find(integration => integration.name === llmIntegrationToUse);
                if ($scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] === undefined) {
                  $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] = {"conversationModel":"", "pBGenerationModel":"", "isMultiConfigAvailable": false}
                }
                $scope.defaultLLMIntegration.conversationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].conversationModel
                $scope.defaultLLMIntegration.pBGenerationModel = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].pBGenerationModel
                $scope.defaultLLMIntegration.isMultiConfigAvailable = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse].isMultiConfigAvailable
            } else if (action === 'set') {
                llmIntegrationToUse = $scope.defaultLLMIntegration.title;
                llMIntegrationDict = $scope.keyStoreValue.llmIntegrations.find(integration => integration.title === llmIntegrationToUse);
                if ($scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] === undefined) {
                  $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name] = {"conversationModel":"", "pBGenerationModel":"", "isMultiConfigAvailable": false}
                }
                $scope.defaultLLMIntegration.conversationModel = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].conversationModel
                $scope.defaultLLMIntegration.pBGenerationModel = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].pBGenerationModel
                $scope.defaultLLMIntegration.isMultiConfigAvailable = $scope.keyStoreValue.llmIntegrationData[llMIntegrationDict.name].isMultiConfigAvailable
            }
            $scope.defaultLLMIntegration.title = llMIntegrationDict.title;
            $scope.defaultLLMIntegration.name = llMIntegrationDict.name;
            $scope.defaultLLMIntegration.modelList = llMIntegrationDict.modelList;
            $scope.defaultLLMIntegration.llmIntegrationsList = $scope.keyStoreValue.llmIntegrations.map(item => item.title);
          }
        
          function updateKeyStoreValue() {
            var llmIntegrationToUse = $scope.defaultLLMIntegration.name;
            var llmIntegrationDict = $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse];
            $scope.keyStoreValue.llmIntegrationToUse = llmIntegrationToUse;
            llmIntegrationDict.conversationModel = $scope.defaultLLMIntegration.conversationModel;
            llmIntegrationDict.pBGenerationModel = $scope.defaultLLMIntegration.pBGenerationModel;
            llmIntegrationDict.isMultiConfigAvailable = $scope.defaultLLMIntegration.isMultiConfigAvailable;
            $scope.keyStoreValue.llmIntegrationData[llmIntegrationToUse] = llmIntegrationDict;
          }

          function updateConfigurationRecord() {
            $resource(API.API_3_BASE + 'keys' + '/' + $scope.entity['hydra:member'][0].uuid, null, {
              'update': {
                method: 'PUT'
              }
            }).update({ 'jSONValue': $scope.keyStoreValue}).$promise.then(function () {
            });
            toaster.success({
              body: 'Successfully updated FortiAI Configuration.'
            });
          }

          function moveBack() {
            WizardHandler.wizard('fortiAIConfiguration').previous();
          }

          function constants() {
            return {
                queryForKeyStore:{
                    "sort": [
                      {
                        "field": "id",
                        "direction": "ASC",
                        "_fieldName": "id"
                      }
                    ],
                    "limit": 30,
                    "logic": "AND",
                    "filters": [
                      {
                        "field": "key",
                        "operator": "like",
                        "_operator": "like",
                        "value": "%FortiAI Configurations%",
                        "type": "primitive"
                      },
                      {
                        "sort": [],
                        "limit": 30,
                        "logic": "AND",
                        "filters": []
                      }
                    ],
                    "__selectFields": [
                      "id",
                      "key",
                      "value",
                      "notes",
                      "@id",
                      "@type",
                      "jSONValue"
                    ]
                },
                defaultLLMIntegration:{
                  "title": "",
                  "name": "",
                  "conversationModel": "",
                  "pBGenerationModel": "",
                  "isMultiConfigAvailable": "",
                  "modelList": [],
                  "llmIntegrationsList": []
                }
              }
          }
        }
    })();
