import { createTheme, alpha } from "@mui/material/styles";

// ─── Brand Colour Tokens ────────────────────────────────────────────────────

const brand = {
  // Red – primary CTAs (Continue, Solve, Let's Play)
  red: {
    50: "#fff0f2",
    100: "#ffd6db",
    200: "#ffaab4",
    300: "#ff7887",
    400: "#ff4a5f",
    500: "#ef3349", // main
    600: "#dd233b",
    700: "#ce142a",
    800: "#a50f22",
    900: "#7a0a19",
  },

  // Yellow – screen backgrounds, accents
  yellow: {
    50: "#fffdf0",
    100: "#fff9d0",
    200: "#fff2c2",
    300: "#ffe88a",
    400: "#ffd72e", // main background
    500: "#ffcf25",
    600: "#f8ba00",
    700: "#edb900",
    800: "#c99b00",
    900: "#a07c00",
  },

  // Orange – reward labels, gradient ends
  orange: {
    50: "#fff7f0",
    100: "#ffe9d0",
    200: "#ffd0a0",
    300: "#ffb068",
    400: "#fd8c43", // reward text
    500: "#ff7c27",
    600: "#e86010",
    700: "#c04d0a",
    800: "#983c07",
    900: "#6e2c04",
  },

  // Neutral text colours
  dark: {
    900: "#2d2b29",
    800: "#282828",
    700: "#4b2807",
    600: "#62401a",
    500: "#856035",
    400: "#a97337",
  },

  // Cream – card fills
  cream: {
    100: "#fff5d1",
    200: "#ffedb8",
    300: "#ffe4a0",
    400: "#ffc977",
  },
};

// ─── Shadows ─────────────────────────────────────────────────────────────────

const shadows = {
  // Layered 3-D button press effect used across all CTAs
  buttonRed: `0px 4px 0px 0px ${brand.red[700]}, 0px 8px 0px 0px ${brand.red[600]}`,
  buttonYellow: `0px 4px 0px 0px ${brand.yellow[700]}, 0px 8px 0px 0px ${brand.yellow[600]}`,
  card: `0px 4px 0px 0px ${brand.cream[400]}`,
  numberPad: `0px 4px 8px 0px ${alpha("#000", 0.12)}`,
};

// ─── Theme ───────────────────────────────────────────────────────────────────

const theme = createTheme({
  // ── Colour Palette ──────────────────────────────────────────────────────
  palette: {
    mode: "light",

    primary: {
      light: brand.red[400],
      main: brand.red[500],
      dark: brand.red[700],
      contrastText: "#ffffff",
    },

    secondary: {
      light: brand.yellow[400],
      main: brand.yellow[500],
      dark: brand.yellow[700],
      contrastText: brand.dark[900],
    },

    warning: {
      light: brand.orange[300],
      main: brand.orange[400],
      dark: brand.orange[600],
      contrastText: "#ffffff",
    },

    info: {
      main: brand.yellow[600],
      contrastText: brand.dark[900],
    },

    success: {
      main: "#4caf50",
      contrastText: "#ffffff",
    },

    error: {
      main: brand.red[500],
      dark: brand.red[700],
      contrastText: "#ffffff",
    },

    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },

    text: {
      primary: brand.dark[900],
      secondary: brand.orange[400],
      disabled: alpha(brand.dark[900], 0.38),
    },

    divider: alpha(brand.dark[900], 0.12),

    // Expose brand tokens on the palette for direct use
    // e.g. theme.palette.brand.yellow[500]
  },

  // ── Typography ──────────────────────────────────────────────────────────
  // Fonts used across the designs:
  //  - "Summary Notes"        → display / game title / button labels
  //  - "Montserrat Alternates" → level names, section headings, reward labels
  //  - "Josefin Sans"          → UI headings (onboarding)
  //  - "Lato"                  → body copy, descriptions
  typography: {
    fontFamily: [
      "Lato",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),

    // Display – game logo ("Sudoku Hatchling")
    h1: {
      fontFamily: '"Summary Notes", cursive',
      fontSize: "6.25rem",      // 100px
      fontWeight: 400,
      lineHeight: 1,
      letterSpacing: "0.036em",
      color: brand.dark[900],
    },

    // Screen titles ("Choose Your Challenge Level:")
    h2: {
      fontFamily: '"Summary Notes", cursive',
      fontSize: "1.875rem",     // 30px
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: "0.02em",
      color: brand.dark[900],
    },

    // Level / section names ("Eggshell Level 1", "Well done, Jhay!")
    h3: {
      fontFamily: '"Montserrat Alternates", sans-serif',
      fontSize: "1.5rem",       // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      color: brand.dark[900],
    },

    // Onboarding step headings
    h4: {
      fontFamily: '"Josefin Sans", sans-serif',
      fontSize: "1.25rem",      // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      color: brand.dark[900],
    },

    // Sub-level label ("Eggshell Level 1" small)
    h5: {
      fontFamily: '"Montserrat Alternates", sans-serif',
      fontSize: "0.875rem",     // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      color: "#ffffff",
    },

    // Reward/caption label
    h6: {
      fontFamily: '"Montserrat Alternates", sans-serif',
      fontSize: "1rem",         // 16px
      fontWeight: 500,
      lineHeight: 1.4,
      color: brand.orange[400],
    },

    // "Eggshell", "Cracked" level names in list
    subtitle1: {
      fontFamily: '"Josefin Sans", sans-serif',
      fontSize: "1.375rem",     // 22px
      fontWeight: 600,
      lineHeight: 1.3,
      color: brand.dark[900],
    },

    // "(Beginner)", difficulty sub-labels
    subtitle2: {
      fontFamily: "Lato, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.4,
      color: alpha(brand.dark[900], 0.6),
    },

    // Instruction text ("Tap a box and select…")
    body1: {
      fontFamily: "Lato, sans-serif",
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.6,
      color: brand.dark[900],
    },

    body2: {
      fontFamily: "Lato, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.5,
      color: alpha(brand.dark[900], 0.7),
    },

    // Button label (large CTAs)
    button: {
      fontFamily: '"Summary Notes", cursive',
      fontSize: "2rem",         // 32px
      fontWeight: 400,
      letterSpacing: "0.12em",
      textTransform: "none",
    },

    // Reward multiplier ("x10")
    overline: {
      fontFamily: '"Montserrat Alternates", sans-serif',
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "0em",
      color: brand.orange[500],
      textTransform: "none",
    },

    // "COMPLETED" banner
    caption: {
      fontFamily: '"Summary Notes", cursive',
      fontSize: "2.8125rem",    // 45px
      fontWeight: 400,
      letterSpacing: "0.056em",
      lineHeight: 1,
      color: "#ffffff",
    },
  },

  // ── Shape ────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 12,   // default – matches CTA buttons
  },

  // ── Component Overrides ──────────────────────────────────────────────────
  components: {
    // ── Button ────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontFamily: "Lato, sans-serif",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 24,
          paddingRight: 24,
          minHeight: 48,
          transition: "transform 0.08s ease, box-shadow 0.08s ease",
          "&:active": {
            transform: "translateY(4px)",
          },
        },

        // ── contained primary (red CTA: Continue / Solve / Let's Play) ──
        containedPrimary: {
          background: brand.red[400],
          color: "#ffffff",
          boxShadow: shadows.buttonRed,
          "&:hover": {
            background: brand.red[400],
            boxShadow: shadows.buttonRed,
            filter: "brightness(1.06)",
          },
          "&:active": {
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            background: alpha(brand.red[400], 0.4),
            color: alpha("#fff", 0.6),
            boxShadow: "none",
          },
        },

        // ── contained secondary (yellow CTA: Continue in Completed screen) ──
        containedSecondary: {
          background: brand.yellow[400],
          color: brand.dark[900],
          boxShadow: shadows.buttonYellow,
          "&:hover": {
            background: brand.yellow[400],
            filter: "brightness(1.04)",
            boxShadow: shadows.buttonYellow,
          },
          "&:active": {
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            background: alpha(brand.yellow[400], 0.4),
            boxShadow: "none",
          },
        },

        // ── outlined ──
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },

        // ── small – number-pad circles ──
        sizeSmall: {
          borderRadius: "50%",
          width: 52,
          height: 52,
          minWidth: 52,
          padding: 0,
          fontSize: "1.25rem",
          fontFamily: "Lato, sans-serif",
          fontWeight: 700,
          background: "#ffffff",
          color: brand.dark[900],
          boxShadow: shadows.numberPad,
          "&:hover": {
            background: "#ffffff",
            filter: "brightness(0.96)",
          },
        },

        // ── icon button variant (close / hint) ──
        ["sizeExtraSmall" as any]: {
          borderRadius: 14,
          width: 44,
          height: 44,
          minWidth: 44,
          padding: 0,
        },
      },
    },

    // ── IconButton ────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: "transform 0.1s ease",
          "&:active": {
            transform: "scale(0.92)",
          },
        },
        // Red close button (top-left of game screen)
        colorPrimary: {
          background: brand.red[500],
          color: "#ffffff",
          "&:hover": {
            background: brand.red[600],
          },
        },
        // Yellow hint button
        colorSecondary: {
          background: brand.yellow[500],
          color: brand.dark[900],
          "&:hover": {
            background: brand.yellow[600],
          },
        },
      },
    },

    // ── Card ──────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: brand.cream[100],
          boxShadow: shadows.card,
          padding: 0,
          overflow: "visible",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "24px",
          "&:last-child": {
            paddingBottom: "24px",
          },
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },

    // ── TextField / Input ─────────────────────────────────────────────────
    // Matches the name-entry input: white bg, yellow border, rounded 20px
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: "#ffffff",
          fontFamily: "Lato, sans-serif",
          fontSize: "1rem",
          letterSpacing: "normal",
          color: brand.dark[900],
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(brand.dark[900], 0.2),
            borderWidth: 1,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: brand.yellow[600],
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: brand.yellow[600],
            borderWidth: 2,
          },
        },
        input: {
          padding: "12px 16px",
          textAlign: "left",
        },
      },
    },

    // ── Radio (level selector) ────────────────────────────────────────────
    MuiRadio: {
      styleOverrides: {
        root: {
          color: alpha("#fff", 0.5),
          "&.Mui-checked": {
            color: "#ffffff",
          },
          "& .MuiSvgIcon-root": {
            fontSize: 28,
          },
        },
      },
    },

    // ── List / level selector rows ────────────────────────────────────────
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          paddingTop: 12,
          paddingBottom: 12,
          "&:hover": {
            background: alpha("#fff", 0.15),
          },
        },
      },
    },

    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: '"Josefin Sans", sans-serif',
          fontWeight: 600,
          fontSize: "1.375rem",
          color: brand.dark[900],
        },
        secondary: {
          fontFamily: "Lato, sans-serif",
          fontSize: "0.875rem",
          color: alpha(brand.dark[900], 0.6),
        },
      },
    },

    // ── Avatar (level icons) ──────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "transparent",
        },
      },
    },

    // ── Chip (badges, tags) ───────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontFamily: '"Montserrat Alternates", sans-serif',
          fontWeight: 500,
          height: 32,
        },
        colorPrimary: {
          background: brand.red[100],
          color: brand.red[700],
        },
        colorSecondary: {
          background: brand.yellow[200],
          color: brand.dark[700],
        },
      },
    },

    // ── Snackbar / Alert ─────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontFamily: "Lato, sans-serif",
          fontSize: "0.9375rem",
        },
        standardSuccess: {
          background: "#e8f5e9",
          color: "#1b5e20",
        },
        standardError: {
          background: brand.red[50],
          color: brand.red[800],
        },
        standardWarning: {
          background: brand.yellow[50],
          color: brand.dark[700],
        },
      },
    },

    // ── Dialog / Modal (Congrats overlay) ────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          background: brand.cream[100],
          boxShadow: `0px 4px 0px 0px ${brand.cream[400]}, 0px 16px 48px ${alpha("#000", 0.2)}`,
          padding: 0,
          overflow: "visible",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Summary Notes", cursive',
          fontSize: "2rem",
          letterSpacing: "0.04em",
          textAlign: "center",
          color: brand.dark[900],
          paddingTop: 28,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 28px",
          textAlign: "center",
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 28px 28px",
          justifyContent: "center",
        },
      },
    },

    // ── Linear / Circular Progress ────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 10,
          background: alpha(brand.yellow[600], 0.25),
        },
        bar: {
          borderRadius: 8,
          background: `linear-gradient(90deg, ${brand.yellow[500]}, ${brand.orange[400]})`,
        },
      },
    },

    MuiCircularProgress: {
      defaultProps: {
        color: "secondary",
      },
    },

    // ── AppBar / Toolbar ──────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: "transparent",
      },
      styleOverrides: {
        root: {
          background: "transparent",
          backdropFilter: "none",
        },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          fontFamily: "Lato, sans-serif",
          fontSize: "0.8125rem",
          background: brand.dark[900],
          color: "#fff",
          padding: "6px 12px",
        },
        arrow: {
          color: brand.dark[900],
        },
      },
    },

    // ── Switch (settings toggles) ─────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 30,
          padding: 0,
        },
        switchBase: {
          padding: 3,
          "&.Mui-checked": {
            transform: "translateX(22px)",
            "& + .MuiSwitch-track": {
              opacity: 1,
              background: brand.yellow[600],
            },
            "& .MuiSwitch-thumb": {
              background: "#ffffff",
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          background: "#ffffff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
        track: {
          borderRadius: 15,
          opacity: 1,
          background: alpha(brand.dark[900], 0.2),
        },
      },
    },

    // ── Slider (difficulty / timer scrubbers) ─────────────────────────────
    MuiSlider: {
      styleOverrides: {
        root: {
          color: brand.yellow[600],
          height: 8,
        },
        thumb: {
          width: 22,
          height: 22,
          background: "#ffffff",
          border: `3px solid ${brand.yellow[600]}`,
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0 0 0 6px ${alpha(brand.yellow[600], 0.25)}`,
          },
        },
        track: {
          borderRadius: 4,
        },
        rail: {
          borderRadius: 4,
          background: alpha(brand.yellow[600], 0.25),
        },
        valueLabel: {
          background: brand.dark[900],
          borderRadius: 8,
          fontFamily: "Lato, sans-serif",
          fontSize: "0.75rem",
        },
      },
    },

    // ── Tab (e.g. game mode tabs) ─────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat Alternates", sans-serif',
          fontWeight: 600,
          fontSize: "0.9375rem",
          textTransform: "none",
          minHeight: 48,
          borderRadius: 12,
          "&.Mui-selected": {
            color: brand.red[500],
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 2,
          background: brand.red[500],
        },
      },
    },

    // ── Table (score leaderboard) ─────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontFamily: '"Montserrat Alternates", sans-serif',
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: brand.dark[900],
            background: brand.yellow[200],
            borderBottom: "none",
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: "Lato, sans-serif",
          fontSize: "0.9375rem",
          borderColor: alpha(brand.dark[900], 0.08),
        },
        body: {
          color: brand.dark[900],
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            background: alpha(brand.yellow[400], 0.08),
          },
        },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(brand.dark[900], 0.1),
        },
      },
    },

    // ── Skeleton (loading states) ─────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: alpha(brand.yellow[400], 0.25),
        },
        rectangular: {
          borderRadius: 16,
        },
      },
    },

    // ── Badge (notification dots) ─────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontFamily: "Lato, sans-serif",
          fontWeight: 700,
          fontSize: "0.6875rem",
          minWidth: 18,
          height: 18,
          padding: "0 4px",
        },
        colorPrimary: {
          background: brand.red[500],
          color: "#ffffff",
        },
        colorSecondary: {
          background: brand.yellow[600],
          color: brand.dark[900],
        },
      },
    },
  },

  // ── Breakpoints (mobile-first – target 393 px iPhone frame) ─────────────
  breakpoints: {
    values: {
      xs: 0,
      sm: 393,   // iPhone 14 Pro
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  // ── Transitions ──────────────────────────────────────────────────────────
  transitions: {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
    duration: {
      shortest: 120,
      shorter: 160,
      short: 200,
      standard: 260,
      complex: 360,
      enteringScreen: 220,
      leavingScreen: 180,
    },
  },
});

// ─── Augment palette typings so TypeScript accepts brand tokens ──────────────
declare module "@mui/material/styles" {
  interface Palette {
    brand: typeof brand;
  }
  interface PaletteOptions {
    brand?: typeof brand;
  }
}

export { brand, shadows };
export default theme;