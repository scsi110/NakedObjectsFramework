/// <reference path="typings/lodash/lodash.d.ts" />
/// <reference path="nakedobjects.models.ts" />
/// <reference path="nakedobjects.app.ts" />

namespace NakedObjects {

    export interface INavigation {
        back() : void;
        forward() : void;
        push() : void;
    }

    app.service("navigation", function () {
        const nav = <INavigation>this;
        nav.back = () => parent.history.back();
        nav.forward = () => parent.history.forward();
        nav.push = () => { };
    });
}