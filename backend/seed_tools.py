"""
Script to seed predefined tools into the database.
Run this to populate the tools table with default tools.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import SessionLocal
from app.models.tool import Tool

def seed_tools():
    db = SessionLocal()
    try:
        # Check if tools already exist
        existing_tools = db.query(Tool).count()
        print(f"Existing tools in database: {existing_tools}")
        
        # Define predefined tools
        predefined_tools = [
            {
                "tool_name": "Weather Tool",
                "tool_api": "https://api.open-meteo.com/v1/forecast"
            },
            {
                "tool_name": "Wikipedia Search Tool",
                "tool_api": "https://en.wikipedia.org/api/rest_v1/page/summary/"
            },
            {
                "tool_name": "Calculator Tool",
                "tool_api": "internal://calculator"
            },
            {
                "tool_name": "Currency Converter Tool",
                "tool_api": "https://api.exchangerate.host/convert"
            },
            {
                "tool_name": "News Tool",
                "tool_api": "https://newsapi.org/v2/top-headlines"
            }
        ]
        
        # Insert tools if they don't exist
        added_count = 0
        for tool_data in predefined_tools:
            existing = db.query(Tool).filter(
                Tool.tool_name == tool_data["tool_name"]
            ).first()
            
            if not existing:
                new_tool = Tool(**tool_data)
                db.add(new_tool)
                added_count += 1
                print(f"Added tool: {tool_data['tool_name']}")
            else:
                print(f"Tool already exists: {tool_data['tool_name']}")
        
        db.commit()
        print(f"\n✅ Seeding complete! Added {added_count} new tools.")
        print(f"Total tools in database: {db.query(Tool).count()}")
        
    except Exception as e:
        print(f"❌ Error seeding tools: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_tools()
