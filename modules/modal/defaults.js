// modal/defaults.js

export const defaults = {
  config: {
    bind: false,
    target: null,
  },

  schema: {
    root: {
      tag: "aside",
      class: "module-modal",
      bind: ".module-modal",
      attr: {
        role: "dialog",
        "aria-modal": "true",
      },
      children: ["container"],
    },

    container: {
      tag: "div",
      class: "modal-container",
      bind: ".modal-container",
      children: ["backdrop", "panel"],
    },

    backdrop: {
      tag: "div",
      class: "modal-backdrop",
      when: "backdrop",
      bind: ".modal-backdrop",
      children: [],
    },

    panel: {
      tag: "div",
      class: "modal-panel",
      bind: ".modal-panel",
      children: ["header", "body", "footer"],
    },

    header: {
      tag: "header",
      class: "modal-head",
      bind: ".modal-head",
      children: ["close"],
    },

    close: {
      tag: "button",
      class: "modal-close",
      when: "closeButton",
      bind: ".modal-close",
      attr: {
        type: "button",
        "aria-label": "Close modal",
      },
      children: [],
    },

    body: {
      tag: "div",
      class: "modal-body",
      bind: ".modal-body",
      children: ["content"],
    },

    content: {
      tag: "div",
      class: "modal-content",
      bind: ".modal-content",
      children: [],
    },

    footer: {
      tag: "footer",
      class: "modal-foot",
      when: "footer",
      bind: ".modal-foot",
      children: [],
    },
  },

  state: {
    class: {
      open: "modal-is-open",
      closing: "modal-is-closing",
      ready: "modal-is-ready",
      error: "modal-has-error",
    },
  },

  features: {
    actionAfter: {
      enabled: false,
      rules: [
        {
          do: "open",
          delay: 1200,
          when: "closed",
        },
      ],
    },

    actionOn: {
      enabled: true,
      rules: [
        {
          do: "close",
          on: [
            ["backdrop", "click"],
            ["close", "click"],
          ],
        },
      ],
    },

    actionOnEvent: {
      enabled: false,
      rules: [],
    },

    actionOnKey: {
      enabled: true,
      rules: [
        {
          do: "close",
          keys: ["Escape", "Esc"],
          when: "open",
        },
      ],
    },

    actionOnLeave: {
      enabled: false,
      rules: [
        {
          do: "open",
          delay: 0,
          once: true,
          when: "closed",
        },
      ],
    },

    actionOnScroll: {
      enabled: false,
      rules: [
        {
          do: "open",
          amount: 300,
          once: true,
          when: "closed",
        },
      ],
    },

    animateCss: {
      enabled: false,
      options: {
        open: [
          {
            target: "root",
            do: "remove",
            classes: ["modal-animate-hide"],
          },
          {
            target: "root",
            do: "add",
            classes: ["modal-animate-show"],
          },
          {
            target: "panel",
            do: "remove",
            classes: ["modal-animate-panel-hide"],
          },
          {
            target: "panel",
            do: "add",
            classes: ["modal-animate-panel-show"],
            wait: true,
            timeout: 700,
          },
        ],

        close: [
          {
            target: "panel",
            do: "remove",
            classes: ["modal-animate-panel-show"],
          },
          {
            target: "panel",
            do: "add",
            classes: ["modal-animate-panel-hide"],
            wait: true,
            timeout: 700,
          },
          {
            target: "root",
            do: "remove",
            classes: ["modal-animate-show"],
          },
          {
            target: "root",
            do: "add",
            classes: ["modal-animate-hide"],
          },
        ],
      },
    },

    animateWaapi: {
      enabled: true,
      options: {
        open: [
          {
            target: "root",
            do: "style",
            styles: {
              opacity: "0",
            },
          },
          {
            target: "panel",
            do: "style",
            styles: {
              opacity: "0",
              transform: "translateY(8px) scale(0.98)",
            },
          },
          {
            target: "root",
            do: "animate",
            keyframes: [
              {
                opacity: 0,
              },
              {
                opacity: 1,
              },
            ],
            timing: {
              duration: 360,
              fill: "both",
              easing: "ease-out",
            },
            wait: true,
          },
          {
            target: "panel",
            do: "animate",
            keyframes: [
              {
                opacity: 0,
                transform: "translateY(8px) scale(0.98)",
              },
              {
                opacity: 1,
                transform: "translateY(0) scale(1)",
              },
            ],
            timing: {
              duration: 620,
              fill: "both",
              easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            },
            wait: true,
          },
        ],

        close: [
          {
            target: "root",
            do: "style",
            styles: {
              opacity: "1",
            },
          },
          {
            target: "panel",
            do: "style",
            styles: {
              opacity: "1",
              transform: "translateY(0) scale(1)",
            },
          },
          {
            target: "panel",
            do: "animate",
            keyframes: [
              {
                opacity: 1,
                transform: "translateY(0) scale(1)",
              },
              {
                opacity: 0,
                transform: "translateY(8px) scale(0.98)",
              },
            ],
            timing: {
              duration: 480,
              fill: "both",
              easing: "ease",
            },
            wait: true,
          },
          {
            target: "root",
            do: "animate",
            keyframes: [
              {
                opacity: 1,
              },
              {
                opacity: 0,
              },
            ],
            timing: {
              duration: 320,
              fill: "both",
              easing: "ease-in",
            },
            wait: true,
          },
        ],
      },
    },

    backdrop: {
      enabled: true,
    },

    closeButton: {
      enabled: true,
    },

    focusTrap: {
      enabled: true,
      options: {
        autoFocus: true,
        restoreFocus: true,
      },
    },

    footer: {
      enabled: false,
    },

    lockScroll: {
      enabled: true,
      options: {
        reserveGap: true,
      },
    },

    storageGate: {
      enabled: false,
      rules: [],
    },

    storageOn: {
      enabled: false,
      rules: [],
    },

    storageOnEvent: {
      enabled: false,
      rules: [],
    },

    titleBlinkOnAway: {
      enabled: false,
      options: {
        title: "",
        interval: 1200,
      },
    },
  },
};
