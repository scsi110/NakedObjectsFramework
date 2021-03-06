/// <reference path="../../Scripts/typings/jasmine/jasmine.d.ts" />
/// <reference path="../../Scripts/typings/angularjs/angular-mocks.d.ts" />


// todo make sure tests are enhanced to validate contents of view models and urls
// todo tests for invalid url combinations ? 

namespace NakedObjects.Test {
   
    describe("nakedobjects.gemini.tests", () => {

        beforeEach(angular.mock.module("app"));

        let $httpBackend: ng.IHttpBackendService;
        let testRouteData: PaneRouteData;
        let testScope: INakedObjectsScope;
        let timeout: ng.ITimeoutService;
        let testEventSpy: jasmine.Spy;
        let cacheFactory: ng.ICacheFactoryService;

        function flushTest() {
            $httpBackend.flush();
            timeout.flush();
        }

        function setupBasePaneRouteData(paneId: number) {
            const trd = new PaneRouteData(paneId);
             
            trd.collections = {};
            trd.actionParams = {};
            //trd.props = {};
            trd.dialogFields = {};
            return trd;
        }

        function getEventTestFunc(t: FocusTarget, i: number, p: number, c: number) {
            return (e : any, target: FocusTarget, index: number, paneId: number, count: number) => {
                expect(e.name).toBe(geminiFocusEvent);
                expect(target).toBe(t);
                expect(index).toBe(i);
                expect(paneId).toBe(p);
                expect(count).toBe(c);
            }
        }

        function setupEventSpy(ts: INakedObjectsScope, target: FocusTarget, index: number, paneId: number, count: number) {
            const tes = jasmine.createSpy("event", getEventTestFunc(target, index, paneId, count));
            tes.and.callThrough();
            testScope.$on(geminiFocusEvent, tes);
            return tes;
        }

        beforeEach(inject(($injector : any) => {
            // Set up the mock http service responses
            $httpBackend = $injector.get("$httpBackend");
            Helpers.setupBackend($httpBackend);
        }));

        beforeEach(inject(($rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, $cacheFactory : ng.ICacheFactoryService) => {
            testScope = $rootScope.$new() as INakedObjectsScope;
            testRouteData = setupBasePaneRouteData(1);
            timeout = $timeout;
            cacheFactory = $cacheFactory;
        }));

        function verifyOpenDialogState(ts: INakedObjectsScope, parmCount : number, title : string) {
            expect(ts.dialogTemplate).toBe(dialogTemplate);
            const dialogViewModel = ts.dialog as DialogViewModel;
            expect(dialogViewModel.parameters.length).toBe(parmCount);
            expect(dialogViewModel.title).toBe(title);
        }

        describe("Go to Home Page", () => {
                                
            function executeHandleHome(handlers: IHandlers) {
                handlers.handleHome(testScope, testRouteData);
                flushTest();
            }

            function verifyBaseHomePageState(ts: INakedObjectsScope) {
                expect(ts.homeTemplate).toBe(homeTemplate);
                const menusViewModel = ts.menus as MenusViewModel;
                expect(menusViewModel.items.length).toBe(10);
                expect(testEventSpy).toHaveBeenCalled();
            }

            function verifyOpenMenuHomePageState(ts: INakedObjectsScope) {
                expect(ts.actionsTemplate).toBe(actionsTemplate);
                expect(ts.menu.actions.length).toBe(4);
            }

            function verifyOpenDialogHomePageState(ts: INakedObjectsScope) {          
                verifyOpenDialogState(ts, 1, "Find Vendor By Account Number");
            }

            describe("Without open menu or dialog", () => {

                beforeEach(inject(() => {
                    testEventSpy = setupEventSpy(testScope, FocusTarget.Menu, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleHome(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseHomePageState(testScope);
                });
            });

            describe("With open menu", () => {

                beforeEach(inject(() => {
                    testRouteData.menuId = "VendorRepository";
                    testEventSpy = setupEventSpy(testScope, FocusTarget.SubAction, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleHome(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseHomePageState(testScope);
                    verifyOpenMenuHomePageState(testScope);
                });
            });

            describe("With open menu and dialog", () => {

                beforeEach(inject(() => {
                    testRouteData.menuId = "VendorRepository";
                    testRouteData.dialogId = "FindVendorByAccountNumber";
                    testEventSpy = setupEventSpy(testScope, FocusTarget.Dialog, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleHome(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseHomePageState(testScope);
                    verifyOpenMenuHomePageState(testScope);
                    verifyOpenDialogHomePageState(testScope);
                });
            });
        });


        describe("Go to Object Page", () => {

            function executeHandleObject(handlers: IHandlers) {
                handlers.handleObject(testScope, testRouteData);
                flushTest();
            }

            function verifyBaseObjectPageState(ts: INakedObjectsScope) {            
                expect(ts.collectionsTemplate).toBe(collectionsTemplate);
                const objectViewModel = ts.object as DomainObjectViewModel;
                expect(objectViewModel.properties.length).toBe(7);
                expect(testEventSpy).toHaveBeenCalled();
            }

            function verifyObjectViewPageState(ts: INakedObjectsScope) {
                expect(ts.objectTemplate).toBe(objectViewTemplate);              
            }

            function verifyObjectEditPageState(ts: INakedObjectsScope) {
                expect(ts.objectTemplate).toBe(objectEditTemplate);  
                expect(ts.actionsTemplate).toBe(nullTemplate);          
            }

            function verifyActionsOpenPageState(ts: INakedObjectsScope) {
                expect(ts.actionsTemplate).toBe(actionsTemplate);              
            }

            function verifyActionsClosedPageState(ts: INakedObjectsScope) {
                expect(ts.actionsTemplate).toBe(nullTemplate);
            }

            function verifyOpenDialogObjectPageState(ts: INakedObjectsScope) {
                verifyOpenDialogState(ts, 2, "List Purchase Orders");
            }

            beforeEach(inject(() => {
                testRouteData.objectId = "AdventureWorksModel.Vendor--1634";
            }));

            describe("View with closed actions no dialog", () => {

                beforeEach(inject(() => {
                    testRouteData.interactionMode = InteractionMode.View;
                    testEventSpy = setupEventSpy(testScope, FocusTarget.ObjectTitle, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleObject(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseObjectPageState(testScope);
                    verifyObjectViewPageState(testScope);
                    verifyActionsClosedPageState(testScope);
                });
            });

            describe("View with open actions no dialog", () => {

                beforeEach(inject(() => {
                    testRouteData.interactionMode = InteractionMode.View;
                    testRouteData.actionsOpen = "true";
                    testEventSpy = setupEventSpy(testScope, FocusTarget.SubAction, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleObject(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseObjectPageState(testScope);
                    verifyObjectViewPageState(testScope);
                    verifyActionsOpenPageState(testScope);
                });
            });

            describe("View with open actions and dialog", () => {

                beforeEach(inject(() => {
                    testRouteData.interactionMode = InteractionMode.View;
                    testRouteData.actionsOpen = "true";
                    testRouteData.dialogId = "ListPurchaseOrders";
                    testEventSpy = setupEventSpy(testScope, FocusTarget.Dialog, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleObject(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseObjectPageState(testScope);
                    verifyObjectViewPageState(testScope);
                    verifyActionsOpenPageState(testScope);
                    verifyOpenDialogObjectPageState(testScope);
                });
            });

            describe("View with closed actions and dialog", () => {

                beforeEach(inject(() => {
                    testRouteData.interactionMode = InteractionMode.View;
                    testRouteData.dialogId = "ListPurchaseOrders";
                    testEventSpy = setupEventSpy(testScope, FocusTarget.Dialog, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleObject(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseObjectPageState(testScope);
                    verifyObjectViewPageState(testScope);
                    verifyActionsClosedPageState(testScope);
                    verifyOpenDialogObjectPageState(testScope);
                });
            });

            describe("Edit", () => {

                beforeEach(inject(() => {
                    testRouteData.interactionMode = InteractionMode.Edit;
                    testEventSpy = setupEventSpy(testScope, FocusTarget.Property, 0, 1, 1);
                }));

                beforeEach(inject((handlers: IHandlers) => {
                    executeHandleObject(handlers);
                }));

                it("Verify state in scope", () => {
                    verifyBaseObjectPageState(testScope);
                    verifyObjectEditPageState(testScope);
                });
            });
        });

        describe("Go to List Page", () => {

            function executeHandleList(handlers: IHandlers) {
               handlers.handleList(testScope, testRouteData);
               flushTest();
            }
        
            function verifyListPlaceholderPageState(ts: INakedObjectsScope) {
                expect(ts.title).toBe("All Vendors With Web Addresses");
                expect(ts.listTemplate).toBe(listPlaceholderTemplate);
                const collectionPlaceholderViewModel = ts.collectionPlaceholder;
                expect(collectionPlaceholderViewModel).not.toBeNull();
                expect(collectionPlaceholderViewModel.description()).toBe("Page 1");
            }

            function verifyListPageState(ts: INakedObjectsScope) {
                expect(ts.listTemplate).toBe(listTemplate);
            }

            function verifyListClosedActionsPageState(ts: INakedObjectsScope) {
                expect(ts.actionsTemplate).toBe(nullTemplate);
            }

            function verifyListOpenActionsPageState(ts: INakedObjectsScope) {
                expect(ts.actionsTemplate).toBe(actionsTemplate);
            }
         

            describe("Vendor list tests", () => {


                function verifyVendorListPageState(ts: INakedObjectsScope) {
                    expect(ts.title).toBe("All Vendors With Web Addresses");
                    const collectionViewModel = ts.collection;
                    expect(collectionViewModel).not.toBeNull();
                    expect(collectionViewModel.description()).toBe("Page 1 of 1; viewing 6 of 6 items");
                    expect(collectionViewModel.items.length).toBe(6);
                }

                beforeEach(inject(() => {
                    testRouteData.menuId = "VendorRepository";
                    testRouteData.actionId = "AllVendorsWithWebAddresses";
                    testRouteData.page = 1;
                    testRouteData.pageSize = 20;
                    testRouteData.state = CollectionViewState.List;
                }));

                describe("List placeholder", () => {

                    beforeEach(inject(() => {
                        testEventSpy = setupEventSpy(testScope, FocusTarget.Action, 0, 1, 1);
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        executeHandleList(handlers);
                    }));

                    it("Verify state in scope", () => {
                        verifyListPlaceholderPageState(testScope);
                    });
                });

                describe("Reload from List placeholder", () => {

                    beforeEach(inject(() => {
                        testEventSpy = setupEventSpy(testScope, FocusTarget.ListItem, 0, 1, 1);
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        $httpBackend.flush();
                        testScope.collectionPlaceholder.reload();
                        $httpBackend.flush();
                        handlers.handleList(testScope, testRouteData);
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListClosedActionsPageState(testScope);
                        verifyVendorListPageState(testScope);
                    });
                });

                describe("List", () => {

                    beforeEach(inject((context: IContext) => {
                        testEventSpy = setupEventSpy(testScope, FocusTarget.ListItem, 0, 1, 1);
                        // cache list
                        context.getListFromMenu(testRouteData.paneId, testRouteData, testRouteData.page, testRouteData.pageSize);
                        $httpBackend.flush();
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        timeout.flush();
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListClosedActionsPageState(testScope);
                        verifyVendorListPageState(testScope);
                    });
                });
            });

            describe("Special offers list tests", () => {

                beforeEach(inject(() => {
                    testRouteData.menuId = "SpecialOfferRepository";
                    testRouteData.actionId = "SpecialOffersWithNoMinimumQty";
                    testRouteData.page = 1;
                    testRouteData.pageSize = 20;
                    testRouteData.state = CollectionViewState.List;
                }));

                function verifySpecialOffersListPageState(ts: INakedObjectsScope) {
                    expect(ts.title).toBe("Special Offers With No Minimum Qty");
                    const collectionViewModel = ts.collection;
                    expect(collectionViewModel).not.toBeNull();
                    expect(collectionViewModel.description()).toBe("Page 1 of 1; viewing 11 of 11 items");
                    expect(collectionViewModel.items.length).toBe(11);
                }

                function verifyOpenDialogListPageState(ts: INakedObjectsScope) {
                    verifyOpenDialogState(ts, 1, "Extend Offers");
                }

                describe("List with closed actions no dialog", () => {

                    beforeEach(inject((context: IContext) => {
                        testEventSpy = setupEventSpy(testScope, FocusTarget.ListItem, 0, 1, 1);
                        // cache list
                        context.getListFromMenu(testRouteData.paneId, testRouteData, testRouteData.page, testRouteData.pageSize);
                        $httpBackend.flush();
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        timeout.flush();
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListClosedActionsPageState(testScope);
                        verifySpecialOffersListPageState(testScope);
                    });
                });

                describe("List with open actions no dialog", () => {

                    beforeEach(inject((context: IContext) => {
                        testRouteData.actionsOpen = "true";
                        testEventSpy = setupEventSpy(testScope, FocusTarget.SubAction, 0, 1, 1);
                        // cache list
                        context.getListFromMenu(testRouteData.paneId, testRouteData, testRouteData.page, testRouteData.pageSize);
                        $httpBackend.flush();
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        timeout.flush();
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListOpenActionsPageState(testScope);
                        verifySpecialOffersListPageState(testScope);
                    });
                });

                describe("List with closed actions and dialog", () => {

                    beforeEach(inject((context: IContext) => {
                        testRouteData.dialogId = "ExtendOffers";
                        testEventSpy = setupEventSpy(testScope, FocusTarget.Dialog, 0, 1, 1);
                        // cache list
                        context.getListFromMenu(testRouteData.paneId, testRouteData, testRouteData.page, testRouteData.pageSize);
                        $httpBackend.flush();
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        timeout.flush();
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListClosedActionsPageState(testScope);
                        verifyOpenDialogListPageState(testScope);
                        verifySpecialOffersListPageState(testScope);
                    });
                });

                describe("List with open actions and dialog", () => {

                    beforeEach(inject((context: IContext) => {
                        testRouteData.actionsOpen = "true";
                        testRouteData.dialogId = "ExtendOffers";
                        testEventSpy = setupEventSpy(testScope, FocusTarget.Dialog, 0, 1, 1);
                        // cache list
                        context.getListFromMenu(testRouteData.paneId, testRouteData, testRouteData.page, testRouteData.pageSize);
                        $httpBackend.flush();
                    }));

                    beforeEach(inject((handlers: IHandlers) => {
                        handlers.handleList(testScope, testRouteData);
                        timeout.flush();
                    }));

                    it("Verify state in scope", () => {
                        verifyListPageState(testScope);
                        verifyListOpenActionsPageState(testScope);
                        verifyOpenDialogListPageState(testScope);
                        verifySpecialOffersListPageState(testScope);
                    });
                });
            });
        });
    });
}