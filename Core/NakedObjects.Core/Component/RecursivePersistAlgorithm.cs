// Copyright Naked Objects Group Ltd, 45 Station Road, Henley on Thames, UK, RG9 1AT
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and limitations under the License.

using Common.Logging;
using NakedObjects.Architecture.Adapter;
using NakedObjects.Architecture.Component;
using NakedObjects.Architecture.Facet;
using NakedObjects.Architecture.Spec;
using NakedObjects.Core.Resolve;
using NakedObjects.Core.Util;

namespace NakedObjects.Core.Component {
    /// <summary>
    /// Recursively walk the object's fields and collections persisting them.  
    /// </summary>
    public sealed class RecursivePersistAlgorithm : IPersistAlgorithm {
        private static readonly ILog Log = LogManager.GetLogger(typeof (RecursivePersistAlgorithm));
        private readonly INakedObjectManager manager;
        private readonly IObjectPersistor persistor;

        public RecursivePersistAlgorithm(IObjectPersistor persistor, INakedObjectManager manager) {
            Assert.AssertNotNull(persistor);
            Assert.AssertNotNull(manager);

            this.persistor = persistor;
            this.manager = manager;
        }

        #region IPersistAlgorithm Members

        public void MakePersistent(INakedObjectAdapter nakedObjectAdapter) {
            if (nakedObjectAdapter.Spec.IsCollection) {

                nakedObjectAdapter.GetAsEnumerable(manager).ForEach(Persist);

                if (nakedObjectAdapter.ResolveState.IsGhost()) {
                    nakedObjectAdapter.ResolveState.Handle(Events.StartResolvingEvent);
                    nakedObjectAdapter.ResolveState.Handle(Events.EndResolvingEvent);
                }
            }
            else {
                if (nakedObjectAdapter.ResolveState.IsPersistent()) {
                    throw new NotPersistableException(Log.LogAndReturn($"Can't make object persistent as it is already persistent: {nakedObjectAdapter}"));
                }
                if (nakedObjectAdapter.Spec.Persistable == PersistableType.Transient) {
                    throw new NotPersistableException(Log.LogAndReturn($"Can't make object persistent as it is not persistable: {nakedObjectAdapter}"));
                }
                Persist(nakedObjectAdapter);
            }
        }

        public string Name => "Simple Bottom Up Persistence Walker";

        #endregion

        private void Persist(INakedObjectAdapter nakedObjectAdapter) {
            if (nakedObjectAdapter.ResolveState.IsAggregated() || (nakedObjectAdapter.ResolveState.IsTransient() && nakedObjectAdapter.Spec.Persistable != PersistableType.Transient)) {
                IAssociationSpec[] fields = ((IObjectSpec) nakedObjectAdapter.Spec).Properties;
                if (!nakedObjectAdapter.Spec.IsEncodeable && fields.Length > 0) {
                    nakedObjectAdapter.Persisting();
                    if (!nakedObjectAdapter.Spec.ContainsFacet(typeof (IComplexTypeFacet))) {
                        manager.MadePersistent(nakedObjectAdapter);
                    }

                    foreach (IAssociationSpec field in fields) {
                        if (!field.IsPersisted) {
                            continue;
                        }
                        if (field is IOneToManyAssociationSpec) {
                            INakedObjectAdapter collection = field.GetNakedObject(nakedObjectAdapter);
                            if (collection == null) {
                                throw new NotPersistableException(Log.LogAndReturn($"Collection {field.Name} does not exist in {nakedObjectAdapter.Spec.FullName}"));
                            }
                            MakePersistent(collection);
                        }
                        else {
                            INakedObjectAdapter fieldValue = field.GetNakedObject(nakedObjectAdapter);
                            if (fieldValue == null) {
                                continue;
                            }
                            Persist(fieldValue);
                        }
                    }
                    persistor.AddPersistedObject(nakedObjectAdapter);
                }
            }
        }

        public override string ToString() {
            return new AsString(this).ToString();
        }
    }

    // Copyright (c) Naked Objects Group Ltd.
}