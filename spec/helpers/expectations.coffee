FakeEvent = require './fake_event'
Caret = require './caret'
{buildField} = require './builders'

class FieldExpectationBase
  into: (@field) ->
    this

  withFormatter: (formatter) ->
    @field.formatter = formatter
    this

  willChange: (@currentDescription) ->
    this

  willNotChange: (@currentDescription) ->
    @to @currentDescription

  to: (@expectedDescription) ->
    @applyDescription()
    @perform()
    @assert()

  applyDescription: ->
    { caret, direction, value } = Caret.parseDescription @currentDescription
    @field.element.val value
    @field.element.caret caret
    @field.selectionDirection = direction

  assert: ->
    actual = Caret.printDescription
               caret: @field.element.caret()
               direction: @field.selectionDirection
               value: @field.element.val()

    expect(actual).toEqual(@expectedDescription)

  @::__defineGetter__ 'field', ->
    @_field ||= buildField()

  @::__defineSetter__ 'field', (field) ->
    @_field = field

class ExpectThatTyping extends FieldExpectationBase
  constructor: (keys...) ->
    @keys = keys

  perform: ->
    @typeKeys()

  typeKeys: ->
    for key in @keys
      event = FakeEvent.withKey(key)
      event.type = 'keydown'
      @field.keyDown event
      if not event.isDefaultPrevented()
        event.type = 'keypress'
        if event.charCode
          @field.keyPress event
        event.type = 'keyup'
        @field.keyUp event

class ExpectThatPasting extends FieldExpectationBase
  constructor: (text) ->
    @text = text

  perform: ->
    @paste()

  paste: ->
    event = FakeEvent.pasteEventWithData Text: @text
    @field.paste event

expectThatTyping = (keys...) ->
  new ExpectThatTyping(keys...)

expectThatPasting = (text) ->
  new ExpectThatPasting(text)

module.exports = { expectThatTyping, expectThatPasting }