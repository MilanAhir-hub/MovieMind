"""
run_tests.py  —  runs every test in the tests folder and prints a summary

Run from the project folder:
    python tests/run_tests.py                  all tests
    python tests/run_tests.py rule_engine      only tests/test_rule_engine.py

Or double-click run_tests.bat on Windows.
"""

import sys
import unittest
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent


def main():
    pattern = f"test_{sys.argv[1]}.py" if len(sys.argv) > 1 else "test_*.py"
    suite = unittest.defaultTestLoader.discover(start_dir=str(TESTS_DIR), pattern=pattern)
    result = unittest.TextTestRunner(verbosity=2).run(suite)

    passed = result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped)
    print("=" * 60)
    print(f"Tests run: {result.testsRun}   Passed: {passed}   "
          f"Failed: {len(result.failures)}   Errors: {len(result.errors)}")
    print("ALL TESTS PASSED" if result.wasSuccessful() else "SOME TESTS FAILED")
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
