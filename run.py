#!/usr/bin/env python3
"""
YieldBot Runner Script

This script provides an easy way to run YieldBot with different options.
"""

import argparse
import asyncio
import sys
from utils import YieldBotUtils

def main():
    parser = argparse.ArgumentParser(description='YieldBot - Discord Yield Distribution Monitor')
    parser.add_argument('--test', action='store_true', help='Run system tests')
    parser.add_argument('--test-discord', action='store_true', help='Test Discord connection only')
    parser.add_argument('--test-blockchain', action='store_true', help='Test blockchain connection only')
    parser.add_argument('--send-test', action='store_true', help='Send test notification')
    parser.add_argument('--run', action='store_true', help='Run the bot')
    
    args = parser.parse_args()
    
    if args.test:
        print("Running full system test...")
        asyncio.run(YieldBotUtils.run_full_test())
    elif args.test_discord:
        print("Testing Discord connection...")
        asyncio.run(YieldBotUtils.test_discord_connection())
    elif args.test_blockchain:
        print("Testing blockchain connection...")
        YieldBotUtils.test_blockchain_connection()
    elif args.send_test:
        print("Sending test notification...")
        asyncio.run(YieldBotUtils.send_test_notification())
    elif args.run:
        print("Starting YieldBot...")
        from main import main as run_main
        asyncio.run(run_main())
    else:
        parser.print_help()
        print("\nQuick start:")
        print("  python run.py --test     # Test your setup")
        print("  python run.py --run      # Start the bot")

if __name__ == "__main__":
    main()
