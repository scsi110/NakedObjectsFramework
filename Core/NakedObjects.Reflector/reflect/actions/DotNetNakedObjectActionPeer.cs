// Copyright � Naked Objects Group Ltd ( http://www.nakedobjects.net). 
// All Rights Reserved. This code released under the terms of the 
// Microsoft Public License (MS-PL) ( http://opensource.org/licenses/ms-pl.html) 

using System.Linq;
using NakedObjects.Architecture.Facets;
using NakedObjects.Architecture.Facets.Actions.Contributed;
using NakedObjects.Architecture.Facets.Actions.Invoke;
using NakedObjects.Architecture.Spec;
using NakedObjects.Reflector.DotNet.Facets.Ordering;
using NakedObjects.Reflector.Peer;
using NakedObjects.Reflector.Spec;

namespace NakedObjects.Reflector.DotNet.Reflect.Actions {
    // TODO (in all DotNet...Peer classes) make all methodsArray throw ReflectiveActionException when 
    // an exception occurs when calling a method reflectively (see execute method).  Then instead of 
    // calling invocationExcpetion() the exception will be passed though, and dealt with generally by 
    // the reflection package (which will be the same for all reflectors and will allow the message to
    // be better passed back to the client).


    public class DotNetNakedObjectActionPeer : DotNetNakedObjectMemberPeer, INakedObjectActionPeer {
        private readonly IIntrospectableSpecification specification;
        private readonly INakedObjectActionParamPeer[] parameters;

        public DotNetNakedObjectActionPeer(IIdentifier identifier,  IIntrospectableSpecification specification, INakedObjectActionParamPeer[] parameters)
            : base(identifier) {
            this.specification = specification;
            this.parameters = parameters;
        }

        public override IIntrospectableSpecification Specification {
            get { return specification; }
        }

        #region INakedObjectActionPeer Members

        public INakedObjectActionParamPeer[] Parameters {
            get { return parameters; }
        }  

        #endregion

        public INakedObjectActionPeer Peer { get { return this; }}
        public IOrderSet<INakedObjectActionPeer> Set { get { return null; } }

        public  bool IsContributedMethod {
            get {
                if (Specification.Service && parameters.Any() &&
                    (!ContainsFacet(typeof(INotContributedActionFacet)) || !GetFacet<INotContributedActionFacet>().NeverContributed())) {
                    return Parameters.Any(p => p.Specification.IsObject || p.Specification.IsCollection);
                }
                return false;
            }
        }

      
        public virtual IIntrospectableSpecification ReturnType {
            get { return GetFacet<IActionInvocationFacet>().ReturnType; }
        }

        public virtual bool HasReturn() {
            return ReturnType != null;
        }

        public bool IsFinderMethod {
            get { return HasReturn() && !ContainsFacet(typeof(IExcludeFromFindMenuFacet)); }
        }

        public bool IsContributedTo(IIntrospectableSpecification spec) {
            return IsContributedMethod
                   && Parameters.Any(parm => ContributeTo(parm.Specification, spec))
                   && !(IsCollection(spec) && IsCollection(GetFacet<IActionInvocationFacet>().ReturnType));
        }

        private bool IsCollection(IIntrospectableSpecification spec) {
            return spec.IsCollection && !spec.IsParseable;
        }

        private bool ContributeTo(IIntrospectableSpecification parmSpec, IIntrospectableSpecification contributeeSpec) {
            var ncf = GetFacet<INotContributedActionFacet>();

            if (ncf == null) {
                return contributeeSpec.IsOfType(parmSpec);
            }

            return contributeeSpec.IsOfType(parmSpec) && !ncf.NotContributedTo(contributeeSpec);
        }
    }

    // Copyright (c) Naked Objects Group Ltd.
}