﻿import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActionComponent } from "./action.component";
import { ViewModelFactory } from "./view-model-factory.service";
import { UrlManager } from "./urlmanager.service";
import * as _ from "lodash";
import * as Models from "./models";
import * as ViewModels from "./nakedobjects.viewmodels";
import { GeminiDropDirective } from "./gemini-drop.directive";
import { GeminiBooleanDirective } from './gemini-boolean.directive';
import {GeminiConditionalChoicesDirective} from './gemini-conditional-choices.directive';
import {GeminiAutocompleteDirective} from './gemini-autocomplete.directive';

import "./rxjs-extensions";
import { Subject } from 'rxjs/Subject';

@Component({
    selector: 'dialog',
    templateUrl: 'app/dialog.component.html',
    directives: [GeminiDropDirective, GeminiBooleanDirective, GeminiConditionalChoicesDirective, GeminiAutocompleteDirective],
    styleUrls: ['app/dialog.component.css']
})
export class DialogComponent {

    constructor(private viewModelFactory: ViewModelFactory, private urlManager: UrlManager) {}

    @Input()
    dialog: ViewModels.DialogViewModel;

    parameterChanged() {
        this.parameterChangedSource.next(true);
        this.parameterChangedSource.next(false);
    }

    private parameterChangedSource = new Subject<boolean>();

    parameterChanged$ = this.parameterChangedSource.asObservable();
}