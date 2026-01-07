{ pkgs, ... }:
let
  # Adiciona PyJWT para autenticação baseada em token.
  python-with-deps = pkgs.python3.withPackages (ps: [
    ps.flask
    ps.pip
    ps.pyjwt
  ]);
in
{
  channel = "stable-24.05";

  packages = [
    python-with-deps
  ];

  env = {
    FLASK_APP = "server.py";
  };

  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          command = ["flask" "run" "--host" "0.0.0.0" "--port" "$PORT"];
          manager = "web";
        };
      };
    };

    workspace = {
      onCreate = {
        default.openFiles = [ ".idx/dev.nix" "server.py" "login.js" "index.html" ];
      };
    };
  };
}
