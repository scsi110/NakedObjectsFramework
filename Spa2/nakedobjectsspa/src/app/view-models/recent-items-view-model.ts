﻿import { RecentItemViewModel } from './recent-item-view-model';
import { ContextService } from '../context.service';
import { ViewModelFactoryService } from '../view-model-factory.service';
import map from 'lodash/map';

import { UrlManagerService } from '../url-manager.service';
import { Pane } from '../route-data';

export class RecentItemsViewModel {

    constructor(
        viewModelFactory: ViewModelFactoryService,
        private readonly context: ContextService,
        private readonly urlManager: UrlManagerService,
        private readonly onPaneId: Pane
    ) {
        const items = map(this.context.getRecentlyViewed(), (o, i) => ({ obj: o, link: o.updateSelfLinkWithTitle(), index: i }));
        this.items = map(items, i => viewModelFactory.recentItemViewModel(i.obj, i.link!, onPaneId, false, i.index));
    }

    items: RecentItemViewModel[];

    readonly clear = () => {
        this.context.clearRecentlyViewed();
        this.items = [];
        this.urlManager.triggerPageReloadByFlippingReloadFlagInUrl(this.onPaneId);
    }
}