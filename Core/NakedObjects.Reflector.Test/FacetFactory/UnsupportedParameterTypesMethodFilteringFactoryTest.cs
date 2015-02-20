﻿// Copyright Naked Objects Group Ltd, 45 Station Road, Henley on Thames, UK, RG9 1AT
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and limitations under the License.

using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NakedObjects.Architecture.Component;
using NakedObjects.Architecture.Facet;
using NakedObjects.Architecture.Reflect;
using NakedObjects.Core.Configuration;
using NakedObjects.Meta.Component;
using NakedObjects.Reflect.Component;
using NakedObjects.Reflect.FacetFactory;

namespace NakedObjects.Reflect.Test.FacetFactory {
    [TestClass]
    // ReSharper disable UnusedMember.Local
    public class UnsupportedParameterTypesMethodFilteringFactoryTest : AbstractFacetFactoryTest {
        private UnsupportedMethodFilteringFactory facetFactory;

        protected override Type[] SupportedTypes {
            get {
                return new[] {
                    typeof (INamedFacet),
                    typeof (IExecutedFacet),
                    typeof (IActionValidationFacet),
                    typeof (IActionInvocationFacet),
                    typeof (IActionDefaultsFacet),
                    typeof (IActionChoicesFacet),
                    typeof (IDescribedAsFacet),
                    typeof (IMandatoryFacet)
                };
            }
        }

        protected override IFacetFactory FacetFactory {
            get { return facetFactory; }
        }

        [TestMethod]
        public void TestActionWithDictionaryParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithDictionaryParameter");
            Assert.IsTrue(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithGenericParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithGenericParameter");
            Assert.IsTrue(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithNoParameters() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithNoParameters");
            Assert.IsFalse(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithNullableParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithNullableParameter");
            Assert.IsFalse(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithOneBadParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithOneBadParameter");
            Assert.IsTrue(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithOneGoodOneBadParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithOneGoodOneBadParameter");
            Assert.IsTrue(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithOneGoodParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithOneGoodParameter");
            Assert.IsFalse(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public void TestActionWithTwoGoodParameter() {
            MethodInfo actionMethod = FindMethodIgnoreParms(typeof (Customer), "ActionWithTwoGoodParameter");
            Assert.IsFalse(facetFactory.Filters(actionMethod, Reflector.ClassStrategy));
        }

        [TestMethod]
        public override void TestFeatureTypes() {
            FeatureType featureTypes = facetFactory.FeatureTypes;
            Assert.IsFalse(featureTypes.HasFlag(FeatureType.Objects));
            Assert.IsFalse(featureTypes.HasFlag(FeatureType.Property));
            Assert.IsFalse(featureTypes.HasFlag(FeatureType.Collections));
            Assert.IsTrue(featureTypes.HasFlag(FeatureType.Action));
            Assert.IsFalse(featureTypes.HasFlag(FeatureType.ActionParameter));
        }

        #region Nested type: Customer

        // ReSharper disable UnusedParameter.Local
        private class Customer {
            public void ActionWithNoParameters() {}
            public void ActionWithOneGoodParameter(int i) {}
            public void ActionWithTwoGoodParameter(int i, Customer c) {}

            public void ActionWithOneBadParameter(out int c) {
                c = 0;
            }

            public void ActionWithOneGoodOneBadParameter(int i, ref int j) {}
            public void ActionWithGenericParameter(Predicate<int> p) {}
            public void ActionWithNullableParameter(int? i) {}
            public void ActionWithDictionaryParameter(string path, Dictionary<string, object> answers) {}
        }

        // ReSharper restore UnusedParameter.Local

        #endregion

        #region Setup/Teardown

        [TestInitialize]
        public override void SetUp() {
            base.SetUp();

            var cache = new ImmutableInMemorySpecCache();
            ReflectorConfiguration.NoValidate = true;

            var config = new ReflectorConfiguration(new Type[] {}, new Type[] {}, new[] {typeof (Customer).Namespace});
            var menuFactory = new NullMenuFactory();

            facetFactory = new UnsupportedMethodFilteringFactory(0);
            var classStrategy = new DefaultClassStrategy(config);
            var metamodel = new Metamodel(classStrategy, cache);

            Reflector = new Reflector(classStrategy, metamodel, config, menuFactory, new IFacetDecorator[] {}, new IFacetFactory[] {facetFactory});
        }

        [TestCleanup]
        public override void TearDown() {
            facetFactory = null;
            base.TearDown();
        }

        #endregion
    }

    // ReSharper restore UnusedMember.Local
}