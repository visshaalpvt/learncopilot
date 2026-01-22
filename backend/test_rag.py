"""
Test script for RAG API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_rag_endpoints():
    print("=" * 60)
    print("TESTING RAG SYSTEM ENDPOINTS")
    print("=" * 60)
    
    # Test 1: Load demo data
    print("\n1. Loading demo data...")
    try:
        resp = requests.post(f"{BASE_URL}/rag/load-demo")
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Success: {data['message']}")
            print(f"   Documents: {data['documents_loaded']}")
            print(f"   Chunks: {data['chunks_created']}")
            print(f"   Subjects: {data['subjects']}")
        else:
            print(f"   ✗ Error: {resp.text}")
    except Exception as e:
        print(f"   ✗ Exception: {e}")
    
    # Test 2: Get stats
    print("\n2. Getting system stats...")
    try:
        resp = requests.get(f"{BASE_URL}/rag/stats")
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Vector Store Stats:")
            print(f"     - Total chunks: {data['vector_store']['total_chunks']}")
            print(f"     - Subjects: {data['vector_store']['subjects']}")
        else:
            print(f"   ✗ Error: {resp.text}")
    except Exception as e:
        print(f"   ✗ Exception: {e}")
    
    # Test 3: Query the RAG system
    print("\n3. Testing RAG query...")
    try:
        resp = requests.post(
            f"{BASE_URL}/rag/query",
            json={
                "query": "What is a data structure?",
                "subject": "Computer Science"
            }
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Answer received!")
            print(f"   Route: {data['route_used']}")
            print(f"   Confidence: {data['confidence']}")
            print(f"   Citations: {len(data['citations'])}")
            print(f"\n   Answer preview:")
            print(f"   {data['answer'][:300]}...")
        else:
            print(f"   ✗ Error: {resp.text}")
    except Exception as e:
        print(f"   ✗ Exception: {e}")
    
    # Test 4: Route preview
    print("\n4. Testing route preview...")
    try:
        resp = requests.get(
            f"{BASE_URL}/rag/route-preview",
            params={"query": "Explain Newton's laws of motion"}
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✓ Route: {data['route']}")
            print(f"   Intent: {data['intent']}")
            print(f"   Confidence: {data['confidence']}")
            print(f"   Reasoning: {data['reasoning']}")
        else:
            print(f"   ✗ Error: {resp.text}")
    except Exception as e:
        print(f"   ✗ Exception: {e}")
    
    print("\n" + "=" * 60)
    print("RAG SYSTEM TESTS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_rag_endpoints()
