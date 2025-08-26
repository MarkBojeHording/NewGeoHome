#!/bin/bash

echo "ServerBeacon Import Script"
echo "=========================="

# Create serverbeacon directory if it doesn't exist
mkdir -p serverbeacon

echo "Ready to import ServerBeacon files..."
echo "Please provide the GitHub repository URL or upload method:"
echo ""
echo "Method 1: GitHub - git clone <repository-url>"
echo "Method 2: Direct upload to serverbeacon/ directory"
echo ""
echo "Run this script with the repository URL as argument:"
echo "bash import_serverbeacon.sh <github-url>"

if [ $# -eq 1 ]; then
    echo "Cloning from: $1"
    git clone "$1" temp_import
    if [ $? -eq 0 ]; then
        echo "Successfully cloned. Copying files..."
        cp -r temp_import/* serverbeacon/
        rm -rf temp_import
        echo "ServerBeacon files imported to serverbeacon/ directory"
        ls -la serverbeacon/
    else
        echo "Failed to clone repository. Please check the URL."
    fi
fi