import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandMenu } from './command-menu';

describe('CommandMenu', () => {
  let component: CommandMenu;
  let fixture: ComponentFixture<CommandMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
