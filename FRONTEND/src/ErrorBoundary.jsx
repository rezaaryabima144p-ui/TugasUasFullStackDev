import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#2f3e2f] flex items-center justify-center px-4">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center">
            <h1 className="text-xl font-black text-[#23803B]">
              Halaman gagal dimuat
            </h1>
            <p className="mt-3 text-sm font-bold text-black">
              Coba refresh halaman. Kalau masih muncul, kirim pesan error ini:
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-gray-100 p-3 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
