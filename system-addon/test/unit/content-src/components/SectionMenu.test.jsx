import {ContextMenu} from "content-src/components/ContextMenu/ContextMenu";
import {IntlProvider} from "react-intl";
import React from "react";
import {_SectionMenu as SectionMenu} from "content-src/components/SectionMenu/SectionMenu";
import {shallow} from "enzyme";
import {shallowWithIntl} from "test/unit/utils";

const messages = require("data/locales.json")["en-US"]; // eslint-disable-line import/no-commonjs

const DEFAULT_PROPS = {
  options: ["RemoveSection", "CheckCollapsed", "Separator", "ManageSection"],
  name: "Section Name",
  source: "TOP_SITES",
  showPrefName: "showSection",
  collapsePrefName: "collapseSection",
  isCollapsed: false,
  onUpdate: () => {},
  visible: false,
  dispatch: () => {}
};

describe("<SectionMenu>", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} />);
  });
  it("should render a ContextMenu element", () => {
    assert.ok(wrapper.find(ContextMenu));
  });
  it("should pass onUpdate, and options to ContextMenu", () => {
    assert.ok(wrapper.find(ContextMenu));
    const contextMenuProps = wrapper.find(ContextMenu).props();
    ["onUpdate", "options"].forEach(prop => assert.property(contextMenuProps, prop));
  });
  it("should give ContextMenu the correct tabbable options length for a11y", () => {
    const {options} = wrapper.find(ContextMenu).props();
    const [firstItem] = options;
    const lastItem = options[options.length - 1];

    // first item should have {first: true}
    assert.isTrue(firstItem.first);
    assert.ok(!firstItem.last);

    // last item should have {last: true}
    assert.isTrue(lastItem.last);
    assert.ok(!lastItem.first);

    // middle items should have neither
    for (let i = 1; i < options.length - 1; i++) {
      assert.ok(!options[i].first && !options[i].last);
    }
  });
  it("should show the correct default options", () => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} />);
    const {options} = wrapper.find(ContextMenu).props();
    let i = 0;
    assert.propertyVal(options[i++], "id", "section_menu_action_remove_section");
    assert.propertyVal(options[i++], "id", "section_menu_action_collapse_section");
    assert.propertyVal(options[i++], "type", "separator");
    assert.propertyVal(options[i++], "id", "section_menu_action_manage_section");
    assert.propertyVal(options, "length", i);
  });
  it("should show Collapse option for an expanded section if CheckCollapsed in options list", () => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} isCollapsed={false} options={["CheckCollapsed"]} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "section_menu_action_collapse_section")));
  });
  it("should show Expand option for a collapsed section if CheckCollapsed in options list", () => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} isCollapsed={true} options={["CheckCollapsed"]} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "section_menu_action_expand_section")));
  });
  it("should show Add Top Site option", () => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} extraOptions={["AddTopSite"]} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.equal(options[0].id, "section_menu_action_add_topsite");
  });
  it("should show Privacy Notice option if privacyNoticeURL is passed", () => {
    wrapper = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} privacyNoticeURL="https://mozilla.org/privacy" />);
    const {options} = wrapper.find(ContextMenu).props();
    let i = 0;
    assert.propertyVal(options[i++], "id", "section_menu_action_remove_section");
    assert.propertyVal(options[i++], "id", "section_menu_action_collapse_section");
    assert.propertyVal(options[i++], "type", "separator");
    assert.propertyVal(options[i++], "id", "section_menu_action_privacy_notice");
    assert.propertyVal(options[i++], "id", "section_menu_action_manage_section");
    assert.propertyVal(options, "length", i);
  });
  it("should call intl.formatMessage with the correct string ids", () => {
    const intlProvider = new IntlProvider({locale: "en", messages});
    const {intl} = intlProvider.getChildContext();
    const spy = sinon.spy(intl, "formatMessage");

    // Identical to calling shallowWithIntl, but passing in the mocked intl object
    const node = <SectionMenu {...DEFAULT_PROPS} />;
    shallow(React.cloneElement(node, {intl}), {context: {intl}});

    // Called once for each option in the menu
    assert.equal(spy.callCount, 3);

    // Called with correct ids both times
    assert.ok(spy.firstCall.calledWith(sinon.match({id: "section_menu_action_remove_section"})));
    assert.ok(spy.secondCall.calledWith(sinon.match({id: "section_menu_action_collapse_section"})));
    assert.ok(spy.thirdCall.calledWith(sinon.match({id: "section_menu_action_manage_section"})));
  });
  describe(".onClick", () => {
    const dispatch = sinon.stub();
    const propOptions = ["Separator", "RemoveSection", "CollapseSection", "ExpandSection", "ManageSection", "AddTopSite", "PrivacyNotice"];
    const expectedActionData = {
      section_menu_action_remove_section: {name: "showSection", value: false},
      section_menu_action_collapse_section: {name: "collapseSection", value: true},
      section_menu_action_expand_section: {name: "collapseSection", value: false},
      section_menu_action_manage_section: undefined,
      section_menu_action_add_topsite: {index: -1},
      section_menu_action_privacy_notice: {url: DEFAULT_PROPS.privacyNoticeURL}
    };
    const {options} = shallowWithIntl(<SectionMenu {...DEFAULT_PROPS} dispatch={dispatch} options={propOptions} />)
      .find(ContextMenu).props();
    afterEach(() => dispatch.reset());
    options.filter(o => o.type !== "separator").forEach(option => {
      it(`should fire a ${option.action.type} action for ${option.id} with the expected data`, () => {
        option.onClick();

        if (option.userEvent && option.action) {
          assert.calledTwice(dispatch);
        } else if (option.userEvent || option.action) {
          assert.calledOnce(dispatch);
        } else {
          assert.notCalled(dispatch);
        }

        // option.action is dispatched
        assert.ok(dispatch.firstCall.calledWith(option.action));
        assert.deepEqual(option.action.data, expectedActionData[option.id]);
      });
      it(`should fire a UserEvent action for ${option.id} if configured`, () => {
        if (option.userEvent) {
          option.onClick();
          const [action] = dispatch.secondCall.args;
          assert.isUserEventAction(action);
          assert.propertyVal(action.data, "source", DEFAULT_PROPS.source);
        }
      });
    });
  });
});
