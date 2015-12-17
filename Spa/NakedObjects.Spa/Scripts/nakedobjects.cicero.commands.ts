﻿/// <reference path="nakedobjects.gemini.services.urlmanager.ts" />

module NakedObjects.Angular.Gemini {

    export abstract class Command {

        constructor(protected urlManager: IUrlManager,
            protected nglocation: ng.ILocationService,
            protected commandFactory: ICommandFactory,
            protected context: IContext,
            protected navigation: INavigation) {
        }

        public fullCommand: string;
        public helpText: string;
        protected minArguments: number;
        protected maxArguments: number;
        protected vm: CiceroViewModel;

        //Must be called after construction and before execute is called
        initialiseWithViewModel(cvm: CiceroViewModel) {
            this.vm = cvm;
        }

        abstract execute(args: string): void;

        public checkIsAvailableInCurrentContext(): void {
            if (!this.isAvailableInCurrentContext()) {
                throw new Error("The command: " + this.fullCommand + " is not available in the current context");
            }
        }

        public abstract isAvailableInCurrentContext(): boolean;

        protected clearInput(): void {
            this.vm.input = "";
        }
        
        //Helper methods follow
        protected clearInputAndSetOutputTo(text: string): void {
            this.clearInput();
            this.vm.output = text;
        }

        protected appendAsNewLineToOutput(text: string): void {
            this.vm.output.concat("/n" + text);
        }

        public checkMatch(matchText: string): void {
            if (this.fullCommand.indexOf(matchText) != 0) {
                throw new Error("No such command: " + matchText);
            }
        }

        public checkNumberOfArguments(argString: string): void {
            if (argString == null) {
                if (this.minArguments == 0) return;
                throw new Error("No arguments provided.");
            }
            const args = argString.split(",");
            if (args.length < this.minArguments || args.length > this.maxArguments) {
                throw new Error("Wrong number of arguments provided.");
            }
        }

        //argNo starts from 0.
        //If argument does not parse correctly, message will be passed to UI
        //and command aborted.
        //Always returns argument trimmed and as lower case
        protected argumentAsString(argString: string, argNo: number, optional: boolean = false): string {
            if (!argString) return undefined;
            if (!optional && argString.split(",").length < argNo + 1) {
                throw new Error("Too few arguments provided");
            }
            var args = argString.split(",");
            if (args.length < argNo + 1) {
                if (optional) {
                    return undefined;
                } else {
                    throw new Error("Required argument number " + (argNo + 1).toString + " is missing");
                }
            }
            return args[argNo].trim().toLowerCase();  // which may be "" if argString ends in a ','
        }

        //argNo starts from 0.
        protected argumentAsNumber(args: string, argNo: number, optional: boolean = false): number {
            const arg = this.argumentAsString(args, argNo, optional);
            const number = parseInt(arg);
            if (number == NaN) {
                throw new Error("Argument number " + +(argNo + 1).toString + + " must be a number");
            }
            return number;
        }

        protected getContextDescription(): string {
            //todo
            return null;
        }

        private pane1RouteData(): PaneRouteData {
            return this.urlManager.getRouteData().pane1;
        }
        //Helpers delegating to RouteData
        protected isHome(): boolean {
            return this.urlManager.isHome(1);
        }
        protected isObject(): boolean {
            return !!this.pane1RouteData().objectId;
        }
        protected isList(): boolean {
            return false;  //TODO
        }
        protected isMenu(): boolean {
            return !!this.pane1RouteData().menuId;
        }
        protected isDialog(): boolean {
            return !!this.pane1RouteData().dialogId;
        }
        protected isCollection(): boolean {
            return false; //TODO
        }
        protected isTable(): boolean {
            throw false; //TODO
        }
        protected isEdit(): boolean {
            return this.pane1RouteData().edit;
        }

        protected matchingProperties(
            obj: DomainObjectRepresentation,
            name: string): PropertyMember[] {
        var fields = _.map(obj.propertyMembers(), prop => prop);
        if (name) {
            var fields = _.filter(fields, (p) => { return p.extensions().friendlyName().toLowerCase().indexOf(name) > -1 });
        }
        return fields;
    }
    }

    export class Action extends Command {

        public fullCommand = "action";
        public helpText = "Open an action from a Main Menu, or object actions. " +
        "The first (optional) argument is the name, or partial name, of the action. " +
        "If the partial name matches more than one action, a list of matches is returned," +
        "but none opened. If no argument is provided, a full list of available action names is returned. " +
        "The partial name may have more than one clause, separated by spaces, and these may match either " +
        "part(s) of the action name or the sub-menu name if one exists. " +
        "Not yet implemented: if the action name matches a single action, then a question-mark may be added as a second "
        "parameter - which will generate a more detailed description of the Action.";

        protected minArguments = 0;
        protected maxArguments = 2;

        public isAvailableInCurrentContext(): boolean {
            return (this.isMenu() || this.isObject()) && !this.isDialog() && !this.isEdit(); //TODO add list
        }

        execute(args: string): void {
            const match = this.argumentAsString(args, 0);
            const p1 = this.argumentAsString(args, 1, true); 
            if (p1) {
                this.clearInputAndSetOutputTo("Second argument for action is not yet supported.");
                return;
            }
            if (this.isObject()) {
                const oid = this.urlManager.getRouteData().pane1.objectId;
                this.context.getObjectByOid(1, oid)
                    .then((obj: DomainObjectRepresentation) => {
                        this.processActions(match, obj.actionMembers());
                    });
            }
            else if (this.isMenu()) {
                const menuId = this.urlManager.getRouteData().pane1.menuId;
                this.context.getMenu(menuId)
                    .then((menu: MenuRepresentation) => {
                        this.processActions(match, menu.actionMembers());
                    });
            }
            //TODO: handle list
        }

        private processActions(match: string, actionsMap: _.Dictionary<ActionMember>) {
            var actions = _.map(actionsMap, action => action);
            if (actions.length == 0) {
                this.clearInputAndSetOutputTo("No actions available");
                return;
            }
            if (match) {
                const clauses = match.split(" ");
                actions = _.filter(actions, (action) => {
                    const path = action.extensions().menuPath();
                    const name = action.extensions().friendlyName().toLowerCase();
                    return _.all(clauses, clause => name.indexOf(clause) >= 0 ||
                        (!!path && path.toLowerCase().indexOf(clause) >= 0));
                });
            }

            switch (actions.length) {
                case 0:
                    this.clearInputAndSetOutputTo(match + " does not match any actions");
                    break;
                case 1:
                    const actionId = actions[0].actionId();
                    this.urlManager.setDialog(actionId, 1);  //1 = pane 1
                    break;
                default:
                    let label = match ? " Matching actions: " : "Actions: ";
                    var s = _.reduce(actions, (s, t) => {
                        const menupath = t.extensions().menuPath() ? t.extensions().menuPath() + " - " : "";
                        return s + menupath + t.extensions().friendlyName() + ", ";
                    }, label);
                    this.clearInputAndSetOutputTo(s);
            }
        }
    }
    export class Back extends Command {

        public fullCommand = "back";
        public helpText = "Move back to the previous context.";
        protected minArguments = 0;
        protected maxArguments = 0;

        public isAvailableInCurrentContext(): boolean {
            return true;
        }

        execute(args: string): void {
            this.navigation.back();
        };
    }
    export class Cancel extends Command {

        public fullCommand = "cancel";
        public helpText = "Leave the current activity (action, or object edit), incomplete.";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isDialog() || this.isEdit();
        }

        execute(args: string): void {
            if (this.isEdit()) {
                this.urlManager.setObjectEdit(false, 1);
            }
            if (this.isDialog()) {
                this.urlManager.closeDialog(1);
            }
        };
    }
    export class Copy extends Command {

        public fullCommand = "copy";
        public helpText = "Not yet implemented.  Copy a reference to an object into the clipboard. If the current context is " +
        "an object and no argument is specified, the object is copied; alternatively the name of a property " +
        "that contains an object reference may be specified. If the context is a list view, then the number of the item " +
        "in that list should be specified.";

        protected minArguments = 0;
        protected maxArguments = 1;

        isAvailableInCurrentContext(): boolean {
            return this.isObject() || this.isList();
        }

        execute(args: string): void {
            if (this.isObject()) {
                if (this.isCollection()) {
                    const item = this.argumentAsNumber(args, 1);
                    this.clearInputAndSetOutputTo("Copy item " + item);
                } else {
                    const arg = this.argumentAsString(args, 1, true);
                    if (arg == null) {
                        this.clearInputAndSetOutputTo("Copy object");
                    } else {
                        this.clearInputAndSetOutputTo("Copy property" + arg);
                    }
                }
            }
            if (this.isList()) {
                const item = this.argumentAsNumber(args, 1);
                this.clearInputAndSetOutputTo("Copy item " + item);
            }
        };
    }
    export class Edit extends Command {

        public fullCommand = "edit";
        public helpText = "Put an object into Edit mode.";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isObject() && !this.isEdit();
        }

        execute(args: string): void {
            this.urlManager.setObjectEdit(true, 1);
        };
    }
    export class Field extends Command {

        public fullCommand = "field";
        public helpText = "Display the name and content of a field or fields. " +
        "In the context of an object, a field is a property; in the context of an action dialog a field is a parameter." +
        "Field may take 2 arguments, both of which are optional. "+
        "The argument is the partial field name. " +
        "If this matches more than one field, a list of matches is returned. " +
        "If no argument is provided, the full list of fields is returned. "+
        "Not yet implemented: the second optional argument applies only to fields in an action dialog, or " +
        "in an object beign edited, and specifies the value, or selection, to be entered " +
        "into the field.  If a ? is provided as the second argument, the field will not be "+
        "updated but further details will be provided about that input field.";
        protected minArguments = 0;
        protected maxArguments = 2;

        isAvailableInCurrentContext(): boolean {
            return this.isObject();
        }

        execute(args: string): void {
            const name = this.argumentAsString(args, 0);
            const p1 = this.argumentAsString(args, 1, true);
            if (p1) {
                this.clearInputAndSetOutputTo("The second argument for field, is not yet supported");
                return;
            }
            const oid = this.urlManager.getRouteData().pane1.objectId;
            const obj = this.context.getObjectByOid(1, oid)
                .then((obj: DomainObjectRepresentation) => {
                    var fields = this.matchingProperties(obj, name);
                    var s: string = "";
                    switch (fields.length) {
                        case 0:
                            if (!name) {
                                s = "No visible fields";
                            } else {
                                s = name + " does not match any fields";
                            }
                            break;
                        case 1:
                            s = "Field: " + this.renderProp(fields[0]);
                            break;
                        default:
                            var label = name ? "Matching fields: " : "Fields: ";
                            s = _.reduce(fields, (s, prop) => {
                                return s + this.renderProp(prop);
                            }, label);
                    }
                    this.clearInputAndSetOutputTo(s);
                });
        };

        private renderProp(pm: PropertyMember): string {
            const name = pm.extensions().friendlyName();
            let value: string = pm.value().toString();
            if (value) {
                let type = _.last(pm.extensions().returnType().split("."));
                if (type == 'string' || type == 'number' || type == 'date') type = "";
                value = type + " " + value;
            } else {
                value = "empty";
            }
            return name + ": " + value + ", ";
        }
    }
    export class Forward extends Command {

        public fullCommand = "forward";
        public helpText = "Move forward to next context in the history (if you have previously moved back).";
        protected minArguments = 0;
        protected maxArguments = 0;

        public isAvailableInCurrentContext(): boolean {
            return true;
        }
        execute(args: string): void {
            this.clearInput();  //To catch case where can't go any further forward and hence url does not change.
            this.navigation.forward();
        };
    }
    export class Gemini extends Command {

        public fullCommand = "gemini";
        public helpText = "Switch to the Gemini (graphical) user interface preserving " +
        "the current context.";
        protected minArguments = 0;
        protected maxArguments = 0;

        public isAvailableInCurrentContext(): boolean {
            return true;
        }
        execute(args: string): void {
            const newPath = "/gemini/"+this.nglocation.path().split("/")[2];
            this.nglocation.path(newPath);
        };
    }
    export class Go extends Command {

        public fullCommand = "go";
        public helpText = "Not yet implemented: Go to an object referenced in a property, or a list." +
        "Go takes one argument.  In the context of an object, that is the name or partial name" +
        "of the property holding the reference. In the context of a list, it is the " +
        "number of the item within the list (starting at 1). ";
        protected minArguments = 1;
        protected maxArguments = 1;

        isAvailableInCurrentContext(): boolean {
            return this.isObject() || this.isList();
        }

        execute(args: string): void {
            const name = this.argumentAsString(args, 0);
            if (this.isList() || this.isCollection()) {
                const item = this.argumentAsNumber(args, 1);
                this.clearInputAndSetOutputTo("The go command is not yet implemented for lists or collections"); 
                return;
            }
            const oid = this.urlManager.getRouteData().pane1.objectId;
            const obj = this.context.getObjectByOid(1, oid)
                .then((obj: DomainObjectRepresentation) => {
                    const allFields = this.matchingProperties(obj, name);
                    const refFields = _.filter(allFields, (p) => { return !p.isScalar() });
                    var s: string = "";
                    switch (refFields.length) {
                        case 0:
                            if (!name) {
                                s = "No visible fields";
                            } else {
                                s = name + " does not match any reference fields";
                            }
                            break;
                        case 1:
                            const propertyRep = refFields[0];
                            this.urlManager.setProperty(propertyRep, 1);
                            break;
                        default:
                            var label = "Multiple reference fields match "+name+": ";
                            s = _.reduce(refFields, (s, prop) => {
                                return s + prop.extensions().friendlyName();
                            }, label);
                    }
                    this.clearInputAndSetOutputTo(s);
                });
          
        };
    }
    export class Help extends Command {

        public fullCommand = "help";
        public helpText = "If no argument specified, help lists the commands available in the current context." +
        "If help is followed by another command word as an argument (or an abbreviation of it), a description of that " +
        "specified Command will be returned.";
        protected minArguments = 0;
        protected maxArguments = 1;

        public isAvailableInCurrentContext(): boolean {
            return true;
        }

        execute(args: string): void {
            var arg = this.argumentAsString(args, 0);
            if (arg) {
                try {
                    const c = this.commandFactory.getCommand(arg);
                    this.clearInputAndSetOutputTo(c.fullCommand + " command: " + c.helpText);
                } catch (Error) {
                        this.clearInputAndSetOutputTo(Error.message);
                }
            } else {
                const commands = this.commandFactory.allCommandsForCurrentContext();
                this.clearInputAndSetOutputTo(commands);
            }
        };
    }
    export class Item extends Command {

        public fullCommand = "item";
        public helpText = "Not yet implemented. In the context of an opened object collection, or a list view, the item command" +
        "will display one or more of the items. If no arguments are specified, item will list all of the " +
        "the items in the object collection, or the first page of items if in a list view. Alternatively, " +
        "the command may be specified with a starting item number and/or an ending item number, for example " +
        "item 3,5 will display items 3,4, and 5.  In the context of a list view only, Item may have a third " +
        "argument to specify a page number greater than 1. See also the Table command.";
        protected minArguments = 0;
        protected maxArguments = 3;

        isAvailableInCurrentContext(): boolean {
            return this.isCollection() || this.isList();
        }

        execute(args: string): void {
            this.clearInputAndSetOutputTo("Item command is not yet implemented");
            //const startNo = this.argumentAsNumber(args, 1, true);
            //const endNo = this.argumentAsNumber(args, 2, true);
            //const pageNo = this.argumentAsNumber(args, 3, true);
            //if (this.isCollection()) {
            //    if (pageNo != null) {
            //        throw new Error("Item may not have a third argument (page number) in the context of an object collection");
            //    }

            //} else {
            //}
        };

    }
    export class Menu extends Command {

        public fullCommand = "menu";
        public helpText = "From any context, Menu opens a named main menu. This " +
        "command normally takes one argument: the name, or partial name, of the menu. " +
        "If the partial name matches more than one menu, a list of matches will be returned " +
        "but no menu will be opened; if no argument is provided a list of all the menus " +
        "will be returned.";
        protected minArguments = 0;
        protected maxArguments = 1;

        isAvailableInCurrentContext(): boolean {
            return true;
        }

        execute(args: string): void {
            const name = this.argumentAsString(args, 0);
            this.context.getMenus()
                .then((menus: MenusRepresentation) => {
                    var links = menus.value();
                    if (name) {
                        links = _.filter(links, (t) => { return t.title().toLowerCase().indexOf(name) > -1; });
                    }
                    switch (links.length) {
                        case 0:
                            this.clearInputAndSetOutputTo(name + " does not match any menu");
                            break;
                        case 1:
                            const menuId = links[0].rel().parms[0].value;
                            this.urlManager.setMenu(menuId, 1);  //1 = pane 1  Resolving promise
                            break;
                        default:
                            var label = name? "Matching menus: ": "Menus: ";
                            var s = _.reduce(links, (s, t) => { return s + t.title() + ", "; }, label);                           
                            this.clearInputAndSetOutputTo(s);
                    }
                });
        }
    }
    export class OK extends Command {

        public fullCommand = "ok";
        public helpText = "Invokes an action, assuming that any necessary parameters have already been set up. ";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isDialog();
        }

        execute(args: string): void {
            //TODO: Need to factor out more helper functions from common code in execute methods
            const dialogId = this.urlManager.getRouteData().pane1.dialogId;
            if (this.isObject()) {
                const oid = this.urlManager.getRouteData().pane1.objectId;
                this.context.getObjectByOid(1, oid)
                    .then((obj: DomainObjectRepresentation) => {
                        const action = obj.actionMember(dialogId);
                        this.context.invokeActionWithParms(action, 1, {});
                    });
            } else if (this.isMenu()) {
                const menuId = this.urlManager.getRouteData().pane1.menuId;
                this.context.getMenu(menuId)
                    .then((menu: MenuRepresentation) => {
                        const action = menu.actionMember(dialogId);
                        this.context.invokeActionWithParms(action, 1, {});
                    });
            } //TODO: List actions
        };
    }
    export class Open extends Command {

        public fullCommand = "open";
        public helpText = "Not yet implemented. Opens a view of a specific collection within an object, from which " +
        "individual items may be read using the item command. Open command takes one argument: " +
        "the name, or partial name, of the collection.  If the partial name matches more than one " +
        "collection, the list of matches will be returned, but none will be opened.";
        protected minArguments = 1;
        protected maxArguments = 1;

        isAvailableInCurrentContext(): boolean {
            return this.isObject();
        }

        execute(args: string): void {
            //const match = this.argumentAsString(args, 0);
            this.clearInputAndSetOutputTo("Open command is not yet implemented");
        };

    }
    export class Paste extends Command {

        public fullCommand = "paste";
        public helpText = "Not yet implemented. Pastes the object reference from the clipboard into a named field " +
        "on an object that is in edit mode, or in an opened action dialog. The paste command takes one argument: the " +
        "name or partial name of the field. If the partial name is ambigious the " +
        "list of matching fields will be returned but the reference will not have been pasted. " +
        "Paste ? will provide a reminder of the object currently held in the clipboard without pasting it anywhere.";
        protected minArguments = 1;
        protected maxArguments = 1;

        isAvailableInCurrentContext(): boolean {
            return this.isEdit() || this.isDialog();
        }

        execute(args: string): void {
            this.clearInputAndSetOutputTo("Paste command is not yet implemented");
            //const match = this.argumentAsString(args, 0);
            //if (this.isEdit()) {
            //}
            //if (this.isDialog) {
            //}
        };

    }
    export class Reload extends Command {

        public fullCommand = "reload";
        public helpText = "Not yet implemented. In the context of an object or a list, reloads the data from the server" +
        "to ensure it is up to date.";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isObject() || this.isList();
        }

        execute(args: string): void {
            this.clearInputAndSetOutputTo("Reload command is not yet implemented");
        };
    }
    export class Root extends Command {

        public fullCommand = "root";
        public helpText = "Not yet implemented. From within a collection context, the root command returns" +
        " to the 'root' object that owns the collection." +
        ". Does not take any arguments";;
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isCollection();
        }

        execute(args: string): void {
            this.clearInputAndSetOutputTo("Root command is not yet implemented");
        };
    }
    export class Save extends Command {

        public fullCommand = "save";
        public helpText = "Not yet implemented. Saves the updated properties on an object that is being edited, and returns " +
        "from edit mode to a normal view of that object";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isEdit();
        }
        execute(args: string): void {
            this.clearInputAndSetOutputTo("save command is not yet implemented");
        };
    }
    export class Table extends Command {
        public fullCommand = "table";
        public helpText = "Not yet implemented. In the context of a list or an opened object collection, the table command" +
        "switches that context to table mode. Items then accessed via the item command, will be presented as table rows." +
        "Invoking table when the context is already in table mode will return the system to list mode.";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return this.isCollection() || this.isList();
        }

        execute(args: string): void {
            const match = this.argumentAsString(args, 0);
            this.clearInputAndSetOutputTo("Table command is not yet implemented");
        };

    }
    export class Where extends Command {

        public fullCommand = "where";
        public helpText = "Reminds the user of the current context.";
        protected minArguments = 0;
        protected maxArguments = 0;

        isAvailableInCurrentContext(): boolean {
            return true;
        }

        execute(args: string): void {
            this.vm.setOutputToSummaryOfRepresentation(this.urlManager.getRouteData().pane1);
        };

    }
}