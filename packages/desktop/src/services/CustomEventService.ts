import type { MainApplication } from '../core/MainApplication'
import { inject, injectable } from 'inversify'
import { Subject } from 'rxjs'
import { EnumServiceKey } from './type'

@injectable()
export class CustomEventService {
  public createMainWin$ = new Subject<void>()
  constructor(
    @inject(EnumServiceKey.MainApplication)
    private mainApplication: MainApplication,
  ) {
    this.mainApplication.getAppEventManager().appBeforeQuit$.subscribe(() => {
      this.destroy()
    });
  }

  public destroy() {
    this.createMainWin$.complete()
  }
}
