export default function AppHeader({ theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbarTitle">Satellite Signal Finder</div>
      </div>

      <button className="themeBtn" onClick={onToggleTheme}>
        {theme === "light" ? "Dark mode" : "Light mode"}
      </button>
    </header>
  );
}