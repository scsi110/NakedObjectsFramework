﻿// Copyright © Naked Objects Group Ltd ( http://www.nakedobjects.net). 
// All Rights Reserved. This code released under the terms of the 
// Microsoft Public License (MS-PL) ( http://opensource.org/licenses/ms-pl.html) 
module NakedObjects.DomainNoProxiesTest
open NUnit.Framework
open DomainTestCode
open TestTypes
open NakedObjects.EntityObjectStore
open TestCode
open System.Data.Entity.Core.Objects
open NakedObjects.Architecture.Adapter
open NakedObjects.Architecture.Resolve
open System
open NakedObjects.Core.Context


let persistor =
    setProxyingAndDeferredLoading <- false
    let p = new EntityObjectStore([|(box PocoConfig :?> EntityContextConfiguration)|], new EntityOidGenerator(NakedObjectsContext.Reflector), NakedObjectsContext.Reflector)
    let p = setupPersistorForTesting p
    p

let overwritePersistor =
    setProxyingAndDeferredLoading <- false
    let config = 
        let pc = new NakedObjects.EntityObjectStore.PocoEntityContextConfiguration()
        pc.ContextName <- "AdventureWorksEntities"  
        pc.DefaultMergeOption <- MergeOption.OverwriteChanges
        pc
    let p = new EntityObjectStore([|(box config :?> EntityContextConfiguration)|], new EntityOidGenerator(NakedObjectsContext.Reflector), NakedObjectsContext.Reflector)
    let p = setupPersistorForTesting p
    p

[<TestFixture>]
type DomainNoProxiesTests() = class              
    [<TestFixtureSetUp>] 
    member x.Setup() = 
        DomainSetup()
        setProxyingAndDeferredLoading <- false
        //let sink = setupPersistorForTesting persistor
        ()
    [<TestFixtureTearDown>] 
    member x.TearDown() =      
        persistor.Reset()
        setProxyingAndDeferredLoading <- true
    [<Test>] member x.TestCreateEntityPersistor() = CanCreateEntityPersistor persistor    
    [<Test>] member x.TestGetInstancesGeneric() = CanGetInstancesGeneric persistor
    [<Test>] member x.TestGetInstancesByType() = CanGetInstancesByType persistor
    [<Test>] member x.TestGetInstancesIsProxy() = CanGetInstancesIsNotProxy persistor
    [<Test>] member x.TestGetManyToOneReference() = CanGetManyToOneReference persistor
    [<Test>] member x.TestGetObjectBySingleKey() = CanGetObjectBySingleKey persistor
    [<Test>] member x.TestGetObjectByMultiKey() = CanGetObjectByMultiKey persistor
    [<Test>] member x.TestGetObjectByStringKey() = CanGetObjectByStringKey persistor
    [<Test>] member x.TestGetObjectByDateKey() = CanGetObjectByDateKey persistor   
    [<Test>] member x.TestCreateTransientObject() = DomainTestCode.CanCreateTransientObject persistor
    [<Test>] member x.TestSaveTransientObjectWithScalarProperties() = CanSaveTransientObjectWithScalarProperties persistor
    [<Test>] member x.TestSaveTransientObjectWithPersistentReferenceProperty() = CanSaveTransientObjectWithPersistentReferenceProperty persistor 
    [<Test>] member x.TestCanSaveTransientObjectWithPersistentReferencePropertyInSeperateTransaction() = CanSaveTransientObjectWithPersistentReferencePropertyInSeperateTransaction persistor 
    [<Test>] member x.TestSaveTransientObjectWithTransientReferenceProperty() = CanSaveTransientObjectWithTransientReferenceProperty persistor           
    [<Test>] member x.TestSaveTransientObjectWithTransientReferencePropertyAndConfirmProxies() = CanSaveTransientObjectWithTransientReferencePropertyAndConfirmNoProxies persistor
    [<Test>] member x.TestUpdatePersistentObjectWithScalarProperties() = CanUpdatePersistentObjectWithScalarProperties persistor
    [<Test>] member x.TestUpdatePersistentObjectWithReferenceProperties() = CanUpdatePersistentObjectWithReferenceProperties persistor
    [<Test>] member x.TestUpdatePersistentObjectWithReferencePropertiesDoFixup() = CanUpdatePersistentObjectWithReferencePropertiesDoFixup persistor            
    [<Test>] member x.TestUpdatePersistentObjectWithCollectionProperties() = CanUpdatePersistentObjectWithCollectionPropertiesWithResolve (resetPersistor persistor)      
    [<Test>] member x.TestUpdatePersistentObjectWithCollectionPropertiesDoFixup() = CanUpdatePersistentObjectWithCollectionPropertiesDoFixup persistor
    [<Test>] member x.TestNavigateReferences() = CanNavigateReferencesNoProxies (resetPersistor persistor)
    [<Test>] member x.TestUpdatePersistentObjectWithScalarPropertiesErrorAndReattempt() = CanUpdatePersistentObjectWithScalarPropertiesErrorAndReattempt persistor 
    [<Test>] member x.TestUpdatePersistentObjectWithScalarPropertiesIgnore() = CanUpdatePersistentObjectWithScalarPropertiesIgnore persistor    
    [<Test>] member x.TestSaveTransientObjectWithScalarPropertiesErrorAndReattempt() = CanSaveTransientObjectWithScalarPropertiesErrorAndReattempt persistor
    [<Test>] member x.TestSaveTransientObjectWithScalarPropertiesErrorAndIgnore() = CanSaveTransientObjectWithScalarPropertiesErrorAndIgnore persistor
    [<Test>] member x.TestPersistingPersistedCalledForCreateInstance() = CanPersistingPersistedCalledForCreateInstance persistor
    [<Test>] member x.TestPersistingPersistedCalledForCreateInstanceWithReference() = CanPersistingPersistedCalledForCreateInstanceWithReference persistor
    [<Test>] member x.TestUpdatingUpdatedCalledForChange() = CanUpdatingUpdatedCalledForChange persistor
    [<Test>] member x.TestGetKeyForType() = CanGetKeyForType persistor
    [<Test>] member x.TestGetKeysForType() = CanGetKeysForType persistor
    [<Test>] member x.TestContainerInjectionCalledForNewInstance() = CanContainerInjectionCalledForNewInstance persistor
    [<Test>] member x.TestContainerInjectionCalledForGetInstance() = CanContainerInjectionCalledForGetInstance (resetPersistor persistor)
    [<Test>] [<Ignore("#993")>] member x.TestCreateManyToManyWithFixup() = CanCreateManyToManyWithFixup persistor 
    [<Test>] member x.TestCanUpdatePersistentObjectWithScalarPropertiesAbort() = CanUpdatePersistentObjectWithScalarPropertiesAbort (resetPersistor persistor)
    [<Test>] member x.TestUpdatePersistentObjectWithReferencePropertiesAbort() = CanUpdatePersistentObjectWithReferencePropertiesAbortWithResolve (resetPersistor persistor)
    [<Test>] member x.TestUpdatePersistentObjectWithCollectionPropertiesAbort() = CanUpdatePersistentObjectWithCollectionPropertiesAbortWithResolve (resetPersistor persistor)
    [<Test>] member x.TestRemoteResolve() = CanRemoteResolve (resetPersistor persistor)
    [<Test>] member x.TestCanGetContextForCollection() = DomainCanGetContextForCollection  persistor
    [<Test>] member x.TestCanGetContextForNonGenericCollection() = DomainCanGetContextForNonGenericCollection  persistor
    [<Test>] member x.TestCanGetContextForArray() = DomainCanGetContextForArray  persistor
    [<Test>] member x.TestCanGetContextForType() = DomainCanGetContextForType  persistor
    [<Test>] member x.TestCanDetectConcurrency() = CanDetectConcurrency persistor
    [<Test>] member x.DataUpdateNoCustomOnPersistingError() = DataUpdateNoCustomOnPersistingError persistor  
    [<Test>] member x.DataUpdateNoCustomOnUpdatingError() = DataUpdateNoCustomOnUpdatingError persistor 
    [<Test>] member x.ConcurrencyNoCustomOnUpdatingError() = ConcurrencyNoCustomOnUpdatingError persistor  
    [<Test>] member x.OverWriteChangesOptionRefreshesObject() = OverWriteChangesOptionRefreshesObject overwritePersistor
    [<Test>] member x.AppendOnlyOptionDoesNotRefreshObject() = AppendOnlyOptionDoesNotRefreshObject persistor
    [<Test>] member x.OverWriteChangesOptionRefreshesObjectNonGenericGet() = OverWriteChangesOptionRefreshesObjectNonGenericGet overwritePersistor
    [<Test>] member x.AppendOnlyOptionDoesNotRefreshObjectNonGenericGet() = AppendOnlyOptionDoesNotRefreshObjectNonGenericGet persistor 
    [<Test>] member x.ExplicitOverwriteChangesRefreshesObject() = ExplicitOverwriteChangesRefreshesObject persistor 
    [<Test>] member x.GetKeysReturnsKey() = GetKeysReturnsKey persistor
end
