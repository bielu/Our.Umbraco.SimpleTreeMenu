﻿angular.module("umbraco").controller('SimpleTreeMenu.EditorController', function ($scope, localizationService, overlayService, editorService) {

    var doctype = $scope.model.config.doctype;

    if (typeof $scope.model.value == "string" || typeof $scope.model.value == "undefined")
        $scope.model.value = {};

    if (!$scope.model.value.items)
        $scope.model.value.items = [];

    $scope.treeOptions = {
        maxDepth: $scope.model.config.levels - 1,
        dropped: function(e) {
            console.log(e.pos);
            setLevels();
        },
        accept: function (sourceNodeScope, destNodesScope, destIndex) {
            return true;
        },
        dragStart: function (event) {
            $scope.setDirty();
        }
    };

    $scope.items = $.extend(true, [], $scope.model.value.items);

    setLevels();

    function cleanItem() {
        return {
            "id": $scope.nextId(),
            "key": String.CreateGuid(),
            "contentTypeAlias": doctype,
            "name": ""
        }
    }

    function setLevels() {
        (function (list, depth) {
            var meth = arguments.callee;
            for (var i = 0; i < list.length; i++) {
                list[i].level = depth;
                if (list[i].items && list[i].items.length > 0) meth(list[i].items, depth + 1);
            }
        })($scope.items, 0);
    }

    $scope.openEditor = function (node) {

        $scope.setDirty();

        editorService.closeAll();

        editorService.open({
            view: '/app_plugins/SimpleTreeMenu/Views/dialog.html',
            show: true,
            doctype: doctype,
            size: 'small',
            data: node.properties,
            submit: function (data) {
                
                node.properties = data;

                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        });
    }

    $scope.addNode = function (node) {

        var newNode = cleanItem();

        if (node) {
            if (!node.items)
                node.items = [];

            newNode.level = node.level + 1;
            node.items.push(newNode);
            $scope.openEditor(node.items[node.items.length - 1]);

        } else {
            newNode.level = 0;
            $scope.items.push(newNode);
            $scope.openEditor($scope.items[$scope.items.length - 1]);
        }

        $scope.setDirty();
    }

    $scope.requestDeleteNode = function (node) {
        localizationService.localizeMany(["content_nestedContentDeleteItem", "general_delete", "general_cancel", "contentTypeEditor_yesDelete"]).then(function (data) {
            const overlay = {
                title: data[1],
                content: data[0],
                closeButtonLabel: data[2],
                submitButtonLabel: data[3],
                submitButtonStyle: "danger",
                close: function () {
                    overlayService.close();
                },
                submit: function () {
                    $scope.deleteNode(node);
                    overlayService.close();
                }
            };

            overlayService.open(overlay);
        });
    }

    $scope.setDirty = function () {
        if ($scope.propertyForm) {
            $scope.propertyForm.$setDirty();
        }
    };

    $scope.deleteNode = function (node) {
        var item;
        (function (list) {
            var meth = arguments.callee;
            for (var i = 0; i < list.length; i++) {
                if (item) return;
                if (list[i].id == node.id || list[i].key == node.key) { item = list[i]; list.splice(i, 1); return; }
                if (list[i].items && list[i].items.length > 0) meth(list[i].items);
            }
        })($scope.items);

        if (item) {
            delete item;
            return true;
        }

        return false;
        
    }

    $scope.nextId = function () {
        var id = 0;
        (function (list) {
            var meth = arguments.callee;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id > id) { id = list[i].id; }
                if (list[i].items && list[i].items.length > 0) meth(list[i].items);
            }
        })($scope.items);

        return id + 1;
    }

    $scope.findNode = function (id) {
        var item;

        (function (list) {
            var meth = arguments.callee;
            for (var i = 0; i < list.length; i++) {
                if (item) return;
                if (list[i].id == id || list[i].key == id) { item = list[i]; return; }
                if (list[i].items && list[i].items.length > 0) meth(list[i].items);
            }
        })($scope.items);
    }



    $scope.$on("formSubmitting", function (ev, args) {

        var clone = $.extend(true, [], $scope.items);

        $scope.model.value.items = clone;

    });
});